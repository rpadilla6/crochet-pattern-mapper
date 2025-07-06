import { useState } from "react";
import "./App.css";
import {
  Theme,
  Container,
  Heading,
  Text,
  Button,
  TextField,
  Separator,
  Box,
  Flex,
  Grid,
} from "@radix-ui/themes";

interface GridConfig {
  rows: number;
  cols: number;
  numValues: number;
}

function App() {
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    rows: 19,
    cols: 24,
    numValues: 9,
  });
  const [gridData, setGridData] = useState<string[][]>([]);
  const [isGenerated, setIsGenerated] = useState(false);

  const generateGrid = () => {
    const { rows, cols, numValues } = gridConfig;
    const totalCells = rows * cols;

    // Create values array (a, b, c, d, e, f, g, h, i, ...)
    const values = Array.from(
      { length: numValues },
      (_, i) => String.fromCharCode(97 + i) // ASCII 97 = 'a'
    );

    // Calculate distribution
    const baseCount = Math.floor(totalCells / numValues);
    const remainder = totalCells % numValues;

    // Create array with all values
    const allValues: string[] = [];
    values.forEach((value, index) => {
      const count = index < remainder ? baseCount + 1 : baseCount;
      allValues.push(...Array(count).fill(value));
    });

    // Shuffle the array for randomization
    for (let i = allValues.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allValues[i], allValues[j]] = [allValues[j], allValues[i]];
    }

    // Create 2D grid
    const grid: string[][] = [];
    for (let i = 0; i < rows; i++) {
      grid[i] = [];
      for (let j = 0; j < cols; j++) {
        grid[i][j] = allValues[i * cols + j];
      }
    }

    setGridData(grid);
    setIsGenerated(true);
  };

  const printGrid = () => {
    window.print();
  };

  return (
    <Theme>
      <Container size="4" className="max-w-6xl mx-auto p-5">
        <Heading size="8" className="mb-6 text-center">
          Crochet Pattern Mapper
        </Heading>

        <Box className="bg-gray-50 p-6 rounded-lg mb-6">
          <Heading size="5" className="mb-4">
            Grid Configuration
          </Heading>

          <Grid columns="3" gap="3" className="mb-6">
            <Box>
              <Text
                as="label"
                htmlFor="rows"
                size="2"
                weight="bold"
                className="block mb-2"
              >
                Rows (N)
              </Text>
              <TextField.Root
                id="rows"
                type="number"
                value={gridConfig.rows}
                onChange={(e) =>
                  setGridConfig((prev) => ({
                    ...prev,
                    rows: parseInt(e.target.value) || 0,
                  }))
                }
                min="1"
                max="50"
                className="w-full"
              />
            </Box>

            <Box>
              <Text
                as="label"
                htmlFor="cols"
                size="2"
                weight="bold"
                className="block mb-2"
              >
                Columns (M)
              </Text>
              <TextField.Root
                id="cols"
                type="number"
                value={gridConfig.cols}
                onChange={(e) =>
                  setGridConfig((prev) => ({
                    ...prev,
                    cols: parseInt(e.target.value) || 0,
                  }))
                }
                min="1"
                max="50"
                className="w-full"
              />
            </Box>

            <Box>
              <Text
                as="label"
                htmlFor="numValues"
                size="2"
                weight="bold"
                className="block mb-2"
              >
                Number of Values (O)
              </Text>
              <TextField.Root
                id="numValues"
                type="number"
                value={gridConfig.numValues}
                onChange={(e) =>
                  setGridConfig((prev) => ({
                    ...prev,
                    numValues: parseInt(e.target.value) || 0,
                  }))
                }
                min="1"
                max="26"
                className="w-full"
              />
            </Box>
          </Grid>

          <Flex gap="3" className="mb-4">
            <Button
              onClick={generateGrid}
              size="3"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Generate Grid
            </Button>
            {isGenerated && (
              <Button
                onClick={printGrid}
                size="3"
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                Print Grid
              </Button>
            )}
          </Flex>
        </Box>

        <Separator size="4" className="mb-6" />

        {isGenerated && (
          <Box className="print:mt-0">
            <Heading size="5" className="mb-4 print:hidden">
              Generated Pattern Grid
            </Heading>
            <Text size="2" color="gray" className="mb-6 print:hidden">
              Grid size: {gridConfig.rows} × {gridConfig.cols} | Values:{" "}
              {gridConfig.numValues} (a-
              {String.fromCharCode(96 + gridConfig.numValues)})
            </Text>

            <Grid
              columns={gridConfig.cols.toString()}
              rows={gridConfig.rows.toString()}
              gap="2"
              p="2"
              minWidth="min-content"
              className="border-1 border-gray-800 box-border bg-white print:border-black rounded-lg"
            >
              {gridData.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <Flex
                    justify="center"
                    align="center"
                    key={`${rowIndex}-${colIndex}`}
                    className="aspect-square min-w-8 box-border border-1 border-gray-800 text-sm font-bold bg-white text-gray-800 font-mono rounded-lg print:w-6 print:h-6 print:text-xs print:border-black print:text-black"
                  >
                    {cell}
                  </Flex>
                ))
              )}
            </Grid>
          </Box>
        )}
      </Container>
    </Theme>
  );
}

export default App;
