library(tidyverse)
library(data.table)
library(Seurat)
library(presto)
library(arrow)

clean_sql_names <- function(names) {
  cleaned <- gsub('[^A-Za-z0-9_]', '_', names)
  cleaned <- ifelse(grepl('^[0-9]', cleaned), paste0('col_', cleaned), cleaned)
  cleaned <- gsub('_{2,}', '_', cleaned)
  cleaned <- gsub('_$', '', cleaned)
  return(cleaned)
}

# applying this tutorial: https://satijalab.org/seurat/articles/pbmc3k_tutorial.html
# load the PBMC dataset
pbmc.data <- Read10X(data.dir = "../db/sample_raw/")

# initialize the Seurat object with the raw, non-normalized data
pbmc <- CreateSeuratObject(counts = pbmc.data, project = "pbmc3k", min.cells = 3, min.features = 200)
pbmc[["percent.mt"]] <- PercentageFeatureSet(pbmc, pattern = "^MT-")

# subset the data using suitable QC metrics and normalize
pbmc <- subset(pbmc, subset = nFeature_RNA > 200 & nFeature_RNA < 2500 & percent.mt < 5)
pbmc <- NormalizeData(pbmc, normalization.method = "LogNormalize", scale.factor = 1e4)

pbmc <- FindVariableFeatures(pbmc, selection.method = 'vst', nfeatures = 2000)
var_features <- VariableFeatures(pbmc)[1:100]

all.genes <- rownames(pbmc)
pbmc <- ScaleData(pbmc, features = all.genes)
pbmc <- ScaleData(pbmc, vars.to.regress = 'percent.mt')

pbmc <- RunPCA(pbmc, features = VariableFeatures(object = pbmc))
pbmc <- FindNeighbors(pbmc, dims = 1:10)
pbmc <- FindClusters(pbmc, resolution = 0.5)

pbmc <- RunUMAP(pbmc, dims = 1:10)

new.cluster.ids <- c("Naive CD4 T", "CD14+ Mono", "Memory CD4 T", "B", "CD8 T", "FCGR3A+ Mono", "NK", "DC", "Platelet")
names(new.cluster.ids) <- levels(pbmc)
pbmc <- RenameIdents(pbmc, new.cluster.ids)

# extract UMAP coordinates, metadata, and gene expression
export <- as.data.frame(Embeddings(pbmc, reduction = "umap"))
colnames(export) <- c("UMAP_1", "UMAP_2")

export$cell_id <- 1:nrow(export)
export$cluster <- Idents(pbmc)
export$orig_ident <- pbmc$orig.ident
export$nFeature_RNA <- pbmc$nFeature_RNA
export$nCount_RNA <- pbmc$nCount_RNA
export$percent_mt <- pbmc$percent.mt
export$pca_cluster <- pbmc$seurat_clusters
export$sample <- 'pbmc_tutorial'

gene_expr_matrix <- GetAssayData(pbmc, assay = "RNA", slot = "data")
gene_expr <- as.data.frame(t(gene_expr_matrix[var_features, ]))
colnames(gene_expr) <- paste0('gene_', clean_sql_names(colnames(gene_expr)))
export <- cbind(export, gene_expr)

export_expr <- gene_expr_matrix[var_features, ] %>%
  as.matrix() %>%
  as.data.frame() %>%
  setnames(as.character(1:nrow(export))) %>% 
  rownames_to_column("gene_name") %>%
  pivot_longer(cols = -gene_name, 
               names_to = "cell_id", 
               values_to = "expr") %>%
  # filter(expr > 0) %>% 
  mutate(
    gene_name = clean_sql_names(gene_name)
  )

write_parquet(export, '../db/sample/sample_qc_filtered.parquet')
write_parquet(export_expr, '../db/sample/sample_qc_filtered_expr.parquet')
