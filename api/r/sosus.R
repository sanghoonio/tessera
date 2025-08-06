library(imager)
library(ggplot2)
library(tidyr)
library(dplyr)
library(data.table)

# Load image
img <- load.image('data/korea.jpg')
img_df <- as.data.frame(img)

# Create uniform grid positions
# spacing <- 5
spacing <- 15
grid_positions <- expand.grid(
  x = seq(spacing, width(img), by = spacing),
  y = seq(spacing, height(img), by = spacing)
)

# Add random noise to positions
noise_amount <- 3
grid_positions$x_noisy <- grid_positions$x + runif(nrow(grid_positions), -noise_amount, noise_amount)
grid_positions$y_noisy <- grid_positions$y + runif(nrow(grid_positions), -noise_amount, noise_amount)

# Round to nearest pixel coordinates
grid_positions$x_round <- round(grid_positions$x_noisy)
grid_positions$y_round <- round(grid_positions$y_noisy)

# Vectorized sampling using merge/join
sampled_colors <- img_df %>%
  inner_join(grid_positions, by = c("x" = "x_round", "y" = "y_round"))

# Shuffle the order (like painting randomly)
sampled_colors <- sampled_colors[sample(nrow(sampled_colors)), ]

# Pivot wider to get RGB columns  
sampled_wide <- sampled_colors %>%
  pivot_wider(names_from = cc, values_from = value, names_prefix = "channel_")
names(sampled_wide)[names(sampled_wide) == "channel_1"] <- "R"
names(sampled_wide)[names(sampled_wide) == "channel_2"] <- "G"
names(sampled_wide)[names(sampled_wide) == "channel_3"] <- "B"

# Apply color quantization
rgb_matrix <- as.matrix(sampled_wide[, c("R", "G", "B")])
set.seed(123)
kmeans_result <- kmeans(rgb_matrix, centers = 16, iter.max = 20)

# Get quantized colors
quantized_rgb <- kmeans_result$centers[kmeans_result$cluster, ]
sampled_wide$R_quant <- quantized_rgb[, 1]
sampled_wide$G_quant <- quantized_rgb[, 2] 
sampled_wide$B_quant <- quantized_rgb[, 3]
sampled_wide$color <- rgb(sampled_wide$R_quant, 
                        sampled_wide$G_quant, 
                        sampled_wide$B_quant)
sampled_save <- sampled_wide %>% 
  select(x, y, color) %>% 
  mutate(y = -y)

# Create pointillism plot
ggplot(sampled_save, aes(x = x, y = y)) +
  geom_point(color = sampled_save$color, 
             size = 0.5) +
  theme_void() +
  coord_fixed()



fwrite(sampled_save, file = 'data/korea.txt')


