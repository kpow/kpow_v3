
#!/usr/bin/env ts-node
import fs from "fs";
import path from "path";

interface ArtistImage {
  key: string;
  url: string;
}

function main() {
  // Define input and output paths
  const inputFile = "missingArtistImages.json";
  const outputFile = "missingArtistImagesCache.js";

  // Verify input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    // Read the JSON file
    const fileContent = fs.readFileSync(inputFile, "utf-8");
    const artistImages: ArtistImage[] = JSON.parse(fileContent);

    // Create the JavaScript module content
    const jsContent = `// Generated from missingArtistImages.json
const artistImages = ${JSON.stringify(artistImages, null, 2)};

export default artistImages;
`;

    // Write the JavaScript module
    fs.writeFileSync(outputFile, jsContent);
    console.log(`Successfully generated ${outputFile} with ${artistImages.length} artist images`);
  } catch (error) {
    console.error("Error processing JSON:", error);
    process.exit(1);
  }
}

main();
