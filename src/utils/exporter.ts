
export const exportImage = (svgElement: SVGElement | null) => {
  if (!svgElement) return;

  // Create a new canvas element
  const canvas = document.createElement('canvas');
  const svgSize = svgElement.getBoundingClientRect();
  canvas.width = svgSize.width;
  canvas.height = svgSize.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Serialize the SVG to a data URL
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const DOMURL = self.URL || self.webkitURL || self;
  const url = DOMURL.createObjectURL(blob);

  // Create an image and draw the SVG onto the canvas
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    DOMURL.revokeObjectURL(url);

    // Convert canvas to a PNG data URL and trigger download
    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = 'umap_chart.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  img.src = url;
};
