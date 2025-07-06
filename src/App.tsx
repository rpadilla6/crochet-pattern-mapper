import { useState, useEffect } from "react";
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

interface SavedConfiguration {
  id: string;
  timestamp: string;
  gridConfig: GridConfig;
  colors: { [key: string]: string };
  gridData: string[][];
}

// Default neutral colors for the values
const getDefaultColors = (numValues: number) => {
  const neutralColors = [
    "#8B7355", // Brown
    "#696969", // Dim Gray
    "#556B2F", // Dark Olive Green
    "#2F4F4F", // Dark Slate Gray
    "#654321", // Dark Brown
    "#708090", // Slate Gray
    "#8B4513", // Saddle Brown
    "#4b064b", // Dark Magenta
    "#B8860B", // Dark Goldenrod
    "#CD853F", // Peru
    "#8B0000", // Dark Red
    "#006400", // Dark Green
    "#191970", // Midnight Blue
    "#8B6914", // Dark Goldenrod
    "#8B7355", // Brown
    "#696969", // Dim Gray
    "#2F4F4F", // Dark Slate Gray
    "#654321", // Dark Brown
    "#708090", // Slate Gray
  ];

  return neutralColors.slice(0, numValues);
};

function App() {
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    rows: 19,
    cols: 24,
    numValues: 9,
  });
  const [gridData, setGridData] = useState<string[][]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [colors, setColors] = useState<{ [key: string]: string }>({});
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfiguration[] | null>(
    null
  );

  // Load saved configurations from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("crochetPatternConfigs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedConfigs(parsed);
      } catch (error) {
        console.error("Error loading saved configurations:", error);
      }
    }
  }, []);

  // Save configurations to localStorage whenever savedConfigs changes
  useEffect(() => {
    if (savedConfigs) {
      localStorage.setItem(
        "crochetPatternConfigs",
        JSON.stringify(savedConfigs)
      );
    }
  }, [savedConfigs]);

  const saveCurrentConfiguration = () => {
    if (!isGenerated || gridData.length === 0) return;

    const newConfig: SavedConfiguration = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      gridConfig: { ...gridConfig },
      colors: { ...colors },
      gridData: gridData.map((row) => [...row]),
    };

    setSavedConfigs((prev) => {
      if (prev) {
        const updated = [newConfig, ...prev.slice(0, 4)]; // Keep only 5 most recent
        return updated;
      }
      return [newConfig];
    });
  };

  const loadConfiguration = (config: SavedConfiguration) => {
    setGridConfig(config.gridConfig);
    setColors(config.colors);
    setGridData(config.gridData);
    setIsGenerated(true);
  };

  const deleteConfiguration = (id: string) => {
    setSavedConfigs((prev) =>
      prev !== null ? prev.filter((config) => config.id !== id) : null
    );
  };

  const generateGrid = () => {
    const { rows, cols, numValues } = gridConfig;
    const totalCells = rows * cols;

    // Create values array (a, b, c, d, e, f, g, h, i, ...)
    const values = Array.from(
      { length: numValues },
      (_, i) => String.fromCharCode(97 + i) // ASCII 97 = 'a'
    );

    // Initialize colors if not already set
    if (Object.keys(colors).length === 0) {
      const defaultColors = getDefaultColors(numValues);
      const newColors: { [key: string]: string } = {};
      values.forEach((value, index) => {
        newColors[value] = defaultColors[index];
      });
      setColors(newColors);
    }

    // Calculate distribution
    const baseCount = Math.floor(totalCells / numValues);
    const remainder = totalCells % numValues;

    // Create array with all values
    const allValues: string[] = [];
    values.forEach((value, index) => {
      const count = index < remainder ? baseCount + 1 : baseCount;
      allValues.push(...Array(count).fill(value));
    });

    // Initialize empty grid
    const grid: string[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(""));

    // Helper function to check if a value can be placed at a position
    const canPlaceValue = (
      row: number,
      col: number,
      value: string
    ): boolean => {
      // Check all 8 adjacent cells (including diagonals)
      const directions = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];

      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
          if (grid[newRow][newCol] === value) {
            return false;
          }
        }
      }

      return true;
    };

    // Helper function to get available positions for a value
    const getAvailablePositions = (value: string): [number, number][] => {
      const positions: [number, number][] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (grid[row][col] === "" && canPlaceValue(row, col, value)) {
            positions.push([row, col]);
          }
        }
      }
      return positions;
    };

    // Place values with improved distribution
    const shuffledValues = [...allValues];
    for (let i = shuffledValues.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledValues[i], shuffledValues[j]] = [
        shuffledValues[j],
        shuffledValues[i],
      ];
    }

    // Try to place each value
    for (const value of shuffledValues) {
      let attempts = 0;
      const maxAttempts = 100;
      let placed = false;

      while (attempts < maxAttempts && !placed) {
        const availablePositions = getAvailablePositions(value);

        if (availablePositions.length === 0) {
          // If no valid positions, find any empty position
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              if (grid[row][col] === "") {
                grid[row][col] = value;
                placed = true;
                break;
              }
            }
            if (placed) break;
          }
        } else {
          // Choose a random available position
          const randomIndex = Math.floor(
            Math.random() * availablePositions.length
          );
          const [row, col] = availablePositions[randomIndex];
          grid[row][col] = value;
          placed = true;
        }

        attempts++;
      }

      // If still not placed, find any empty position
      if (!placed) {
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if (grid[row][col] === "") {
              grid[row][col] = value;
              break;
            }
          }
        }
      }
    }

    setGridData(grid);
    setIsGenerated(true);
  };

  const updateColor = (value: string, newColor: string) => {
    setColors((prev) => ({
      ...prev,
      [value]: newColor,
    }));
  };

  const printGrid = () => {
    window.print();
  };

  // Calculate count of each value in the grid
  const getValueCounts = () => {
    const counts: { [key: string]: number } = {};
    gridData.forEach((row) => {
      row.forEach((cell) => {
        counts[cell] = (counts[cell] || 0) + 1;
      });
    });
    return counts;
  };

  // Helper function to get cell style with hover effect
  const getCellStyle = (cellValue: string) => {
    const baseColor = colors[cellValue] || "#ccc";
    const isHovered = hoveredValue === cellValue;
    const isOtherHovered = hoveredValue && hoveredValue !== cellValue;

    let backgroundColor = baseColor;
    let opacity = 1;

    if (isHovered) {
      // Brighten the hovered value
      backgroundColor = baseColor;
      opacity = 1;
    } else if (isOtherHovered) {
      // Dim other values when one is hovered
      opacity = 0.3;
    }

    return {
      backgroundColor,
      color: baseColor ? "#fff" : "#000",
      opacity,
      transition: "opacity 0.2s ease-in-out",
    };
  };

  return (
    <Theme>
      <Container size="4" className="max-w-6xl mx-auto p-5">
        <Heading
          size="8"
          mb="6"
          className="text-left sm:text-center print:hidden"
        >
          Pattern Mapper
        </Heading>

        <Box className="bg-gray-50 p-6 rounded-lg mb-6 print:!hidden">
          <Heading size="5" mb="4">
            Grid Configuration
          </Heading>

          <Grid columns="3" gap="3" className="mb-3">
            <Box>
              <Text as="label" htmlFor="rows" size="2" weight="bold" mb="2">
                Rows (N)
              </Text>
              <TextField.Root
                id="rows"
                type="number"
                value={gridConfig.rows}
                onChange={(e) =>
                  setGridConfig((prev) => ({
                    ...prev,
                    rows: parseInt(e.target.value),
                  }))
                }
                min="1"
                max="50"
                className="w-full"
              />
            </Box>

            <Box>
              <Text as="label" htmlFor="cols" size="2" weight="bold" mb="2">
                Columns (M)
              </Text>
              <TextField.Root
                id="cols"
                type="number"
                value={gridConfig.cols}
                onChange={(e) =>
                  setGridConfig((prev) => ({
                    ...prev,
                    cols: parseInt(e.target.value),
                  }))
                }
                min="1"
                max="50"
                className="w-full"
              />
            </Box>

            <Box>
              <Text as="label" htmlFor="colors" size="2" weight="bold" mb="2">
                Colors
              </Text>
              <TextField.Root
                id="colors"
                type="number"
                value={gridConfig.numValues}
                onChange={(e) =>
                  setGridConfig((prev) => ({
                    ...prev,
                    numValues: parseInt(e.target.value),
                  }))
                }
                min="1"
                max="26"
                className="w-full"
              />
            </Box>
          </Grid>

          <Grid columns={{ initial: "2", sm: "3" }} gap="3" width="1fr">
            <Button onClick={generateGrid} size="3" color="purple">
              Generate Grid
            </Button>
            {isGenerated && (
              <>
                <Button
                  onClick={printGrid}
                  size="3"
                  variant="outline"
                  color="purple"
                >
                  Print Grid
                </Button>
                <Button
                  onClick={saveCurrentConfiguration}
                  size="3"
                  variant="outline"
                  color="green"
                  className="!col-span-2 sm:!col-span-1"
                >
                  Save Configuration
                </Button>
              </>
            )}
          </Grid>
        </Box>

        {/* Saved Configurations Section */}
        {savedConfigs && savedConfigs.length > 0 && (
          <>
            <Separator size="4" className="mb-6 print:hidden" />
            <Box className="bg-gray-50 p-6 rounded-lg mb-6 print:!hidden">
              <Heading size="5" mb="4">
                Recent Saves
              </Heading>
              <Flex direction="column" gap="3">
                {savedConfigs.map((config) => (
                  <Flex
                    key={config.id}
                    justify="between"
                    align="center"
                    className="bg-white p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer"
                    onClick={() => loadConfiguration(config)}
                  >
                    <Box>
                      <Text size="3" weight="bold" className="text-gray-900">
                        {config.timestamp}
                      </Text>
                      <Text size="2" color="gray" ml="2">
                        {config.gridConfig.rows} × {config.gridConfig.cols} |{" "}
                        {config.gridConfig.numValues} colors
                      </Text>
                    </Box>
                    <Button
                      size="2"
                      variant="ghost"
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConfiguration(config.id);
                      }}
                      className="hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </Flex>
                ))}
              </Flex>
            </Box>
          </>
        )}

        <Separator size="4" className="mb-6" />

        {isGenerated && (
          <Box className="print:mt-0">
            <Heading size="5" className="mb-4 print:hidden">
              Generated Pattern Grid
            </Heading>
            <Text size="2" color="gray" className="mb-6 print:hidden">
              Grid size: {gridConfig.rows || 0} × {gridConfig.cols || 0} |
              Colors:{" "}
              <span className="uppercase">
                {gridConfig.numValues} (a-
                {String.fromCharCode(96 + gridConfig.numValues)})
              </span>
            </Text>

            {/* Value Legend */}
            <Box className="mb-6 mt-2 print:mb-4">
              <Heading size="4" className="print:text-sm" mb="2">
                Distribution
              </Heading>
              <Flex wrap="wrap" gap="3" className="print:gap-2">
                {Object.entries(getValueCounts())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([value, count]) => (
                    <Flex
                      key={value}
                      align="center"
                      gap="2"
                      className="bg-gray-100 px-3 py-2 rounded-lg print:bg-white print:border print:border-gray-300 focus-within:outline-2 focus-within:outline-gray-900 "
                      onMouseEnter={() => setHoveredValue(value)}
                      onMouseLeave={() => setHoveredValue(null)}
                      style={{
                        opacity:
                          hoveredValue && hoveredValue !== value ? 0.3 : 1,
                        transition: "opacity 0.2s ease-in-out",
                      }}
                    >
                      <div className="relative">
                        <Flex
                          justify="center"
                          align="center"
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded font-bold text-sm print:w-4 print:h-4 print:text-xs pointer-events-none uppercase"
                          style={{
                            backgroundColor: colors[value] || "#ccc",
                            color: colors[value] ? "#fff" : "#000",
                          }}
                        >
                          {value}
                        </Flex>
                        <input
                          type="color"
                          value={colors[value] || "#ccc"}
                          onChange={(e) => updateColor(value, e.target.value)}
                          className="absolute top-0 left-0 w-6 h-6 rounded cursor-pointer print:hidden opacity-0"
                          title={`Change color for ${value}`}
                        />
                      </div>
                      <Text size="2" weight="bold" className="print:text-xs">
                        {count}
                      </Text>
                    </Flex>
                  ))}
              </Flex>
            </Box>

            <Box className="overflow-x-auto print:overflow-visible">
              <div
                className="grid gap-3 p-4 border-1 min-w-min w-fit border-gray-800 box-border bg-white print:border-black print:gap-0 rounded-lg"
                style={{
                  gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(32px, 1fr))`,
                  gridTemplateRows: `repeat(${gridConfig.rows}, minmax(32px, 1fr))`,
                }}
              >
                {gridData.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <Flex
                      justify="center"
                      align="center"
                      key={`${rowIndex}-${colIndex}`}
                      className="aspect-square min-w-8 text-sm font-bold font-mono rounded-full print:rounded-none print:border-black print:border-1  print:text-black uppercase cursor-pointer"
                      style={getCellStyle(cell)}
                      onMouseEnter={() => setHoveredValue(cell)}
                      onMouseLeave={() => setHoveredValue(null)}
                    >
                      {cell}
                    </Flex>
                  ))
                )}
              </div>
            </Box>
          </Box>
        )}
        <div className="mt-6 w-full flex justify-center">
          <Text size="1" color="gray">
            Made with love for my wife Danielle, and all the other Crocheters
            out there!
          </Text>
        </div>
      </Container>
    </Theme>
  );
}

export default App;
