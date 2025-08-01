
library(tidyverse)
library(data.table)
library(Seurat)
library(presto)


# cell type gene expression markers from kaminski: https://doi.org/10.1126/sciadv.aba1983
markers_path <- 'kaminski_markers.txt'
markers <- fread(markers_path) %>% select(-V1)

markers_genes <- markers %>% 
  group_by(cellType) %>% 
  slice_max(logDOR, n = 10) %>% 
  summarize(genes = list(gene)) %>%
  deframe()

do_umap <- function(path) {
  # applying this tutorial: https://satijalab.org/seurat/articles/pbmc3k_tutorial.html
  seurat_obj <- readRDS(path)
  seurat_obj[['percent.mt']] <- PercentageFeatureSet(seurat_obj, pattern = '^MT-')
  cat(seurat_obj)
  
  
  ## basic qc
  cat('QC plots')
  nfeature_low <- 200
  nfeature_high <- 2500
  percent_mt <- 5
  
  pass_nfeature_low <- seurat_obj$nFeature_RNA > nfeature_low
  pass_nfeature_high <- seurat_obj$nFeature_RNA < nfeature_high
  pass_nfeature_both <- pass_nfeature_low & pass_nfeature_high
  pass_percentmt <- seurat_obj$percent.mt < percent_mt
  pass_all <- pass_nfeature_both & pass_percentmt
  
  summary_qc <- data.frame(
    total_features = nrow(seurat_obj),
    total_samples = ncol(seurat_obj),
    samples_pass_nfeature_low = sum(pass_nfeature_low),
    samples_pass_nfeature_high = sum(pass_nfeature_high),
    samples_pass_nfeature_both = sum(pass_nfeature_both),
    samples_pass_percentmt = sum(pass_percentmt),
    samples_pass_all = sum(pass_all)
  )
  
  cat(summary_qc)
  print(VlnPlot(seurat_obj, features = c('nFeature_RNA', 'nCount_RNA', 'percent.mt')))
  print(FeatureScatter(seurat_obj, feature1 = 'nCount_RNA', feature2 = 'nFeature_RNA'))
  print(FeatureScatter(seurat_obj, feature1 = 'nCount_RNA', feature2 = 'percent.mt'))
  
  
  ## subset cells by qc filters and normalize
  ### only keep cells that have unique feature counts > 200 or < 2500
  ### only keep cells that have < 5% mitochondrial counts
  seurat_obj_subset <- subset(seurat_obj, subset = nFeature_RNA > nfeature_low & nFeature_RNA < nfeature_high & percent.mt < percent_mt)
  seurat_obj_subset <- NormalizeData(seurat_obj_subset, normalization.method = 'LogNormalize', scale.factor = 10000)
  
  
  ## feature identification and selection
  cat('variable feature identification')
  seurat_obj_subset <- FindVariableFeatures(seurat_obj_subset, selection.method = 'vst', nfeatures = 2000)
  top10 <- head(VariableFeatures(seurat_obj_subset), 10)
  print(LabelPoints(plot = VariableFeaturePlot(seurat_obj_subset), points = top10, repel = TRUE))
  
  
  ## scale data for dimensionality reduction
  all.genes <- rownames(seurat_obj_subset)
  seurat_obj_subset <- ScaleData(seurat_obj_subset, features = all.genes)
  
  
  ## pca
  cat('PCA')
  seurat_obj_subset <- RunPCA(seurat_obj_subset, features = VariableFeatures(object = seurat_obj_subset))
  print(seurat_obj_subset[['pca']], dims = 1:2, nfeatures = 5)
  print(VizDimLoadings(seurat_obj_subset, dims = 1:2, reduction = 'pca'))
  print(ElbowPlot(seurat_obj_subset))
  
  
  ## cell clustering
  seurat_obj_subset <- FindNeighbors(seurat_obj_subset, dims = 1:10)
  seurat_obj_subset <- FindClusters(seurat_obj_subset, resolution = 0.5)
  
  
  ## umap
  cat('UMAP')
  seurat_obj_subset <- RunUMAP(seurat_obj_subset, dims = 1:10)
  print(DimPlot(seurat_obj_subset, reduction = 'umap', label = TRUE) + NoLegend())
  
  
  ## identify differently expressed features across clusters
  # find markers for every cluster compared to all remaining cells, report only the positive ones
  seurat_obj_subset.markers <- FindAllMarkers(seurat_obj_subset, only.pos = TRUE)
  seurat_obj_subset.markers %>%
    group_by(cluster) %>%
    dplyr::filter(avg_log2FC > 1) %>%
    slice_head(n = 10) %>%
    ungroup() -> top10
  print(DoHeatmap(seurat_obj_subset, features = top10$gene) + NoLegend())
  
  
  ## identify cell clusters through canonical markers
  cluster_genes <- seurat_obj_subset.markers %>% 
    group_by(cluster) %>% 
    summarize(genes = list(gene)) %>% 
    deframe()
  
  best_matches <- map_dfr(names(cluster_genes), function(cluster_id) {
    overlaps <- map_int(markers_genes, function(cell_type_genes) {
      length(intersect(cluster_genes[[cluster_id]], cell_type_genes))
    })
    
    best_match <- names(which.max(overlaps))
    max_overlap <- max(overlaps)
    
    data.frame(
      cluster = cluster_id,
      best_cell_type = best_match,
      max_shared_genes = max_overlap
    )
  })
  
  new.cluster.ids <- best_matches$best_cell_type
  names(new.cluster.ids) <- levels(seurat_obj_subset)
  seurat_obj_subset <- RenameIdents(seurat_obj_subset, new.cluster.ids)
  
  print(DimPlot(seurat_obj_subset, reduction = 'umap', label = TRUE) + NoLegend())
  
  
  ### umap df
  umap_coords <- as.data.frame(Embeddings(seurat_obj_subset, reduction = "umap"))
  colnames(umap_coords) <- c("UMAP_1", "UMAP_2")
  umap_coords$cluster <- Idents(seurat_obj_subset)
  umap_coords$orig.ident <- seurat_obj_subset$orig.ident
  umap_coords$nFeature_RNA <- seurat_obj_subset$nFeature_RNA
  umap_coords$nCount_RNA <- seurat_obj_subset$nCount_RNA
  umap_coords$percent.mt <- seurat_obj_subset$percent.mt
}
