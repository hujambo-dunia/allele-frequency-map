import { Map, View, Graticule } from "ol";
import { OSM, Vector, XYZ } from "ol/source";
import { GeoJSON } from "ol/format";
import * as interaction from "ol/interaction";
import * as style from "ol/style";
import * as layer from "ol/layer";
import * as control from "ol/control";
import { fromLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Style, Icon } from "ol/style";
import Overlay from "ol/Overlay";
import TileLayer from "ol/layer/Tile";
import BaseLayers from "./baseLayers.json";

/**
 * MapViewer class for creating and managing OpenLayers maps with allele frequency visualization
 * @param {Object} mv - MapViewer instance object
 * @returns {Object} Enhanced MapViewer instance
 */
export function MapViewer(mv = {}) {
    // Initialize properties
    mv.gMap = null;
    mv.alleleVectorSource = null;
    mv.alleleVectorLayer = null;
    mv.overlay = null;
    mv.features = null;

    /**
     * Create pie chart icon for allele frequency visualization
     * @param {number} alleleFrequency - Allele frequency value (0-1)
     * @returns {string} Base64 encoded SVG data URI
     */
    mv.createPieChartIcon = (alleleFrequency) => {
        if (typeof alleleFrequency !== "number" || alleleFrequency < 0 || alleleFrequency > 1) {
            console.warn("Invalid allele frequency value:", alleleFrequency);
            alleleFrequency = 0;
        }

        const size = 40;
        const radius = size / 2;
        const redAngle = alleleFrequency * 360;

        const x = radius + radius * Math.sin((redAngle * Math.PI) / 180);
        const y = radius - radius * Math.cos((redAngle * Math.PI) / 180);

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                <circle r="${radius}" cx="${radius}" cy="${radius}" fill="#452701" />
                <path d="M${radius},${radius} L${radius},0
                       A${radius},${radius} 0 ${alleleFrequency > 0.5 ? 1 : 0},1
                       ${x},${y} Z"
                      fill="#ff6600"/>
            </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    };

    /**
     * Filter and display markers for specific gene
     * @param {string} gene - Gene name to filter by
     */
    mv.filterByGene = (gene) => {
        if (!mv.alleleVectorSource || !mv.features) {
            console.warn("Vector source or features not available");
            return;
        }

        if (!gene) {
            console.warn("Gene parameter is required");
            return;
        }

        mv.overlay.setPosition(undefined); // Clear tooltips
        mv.alleleVectorSource.clear();

        const filtered = mv.features.filter((f) => f.gene === gene);

        filtered.forEach((featureData) => {
            const freq = parseFloat(featureData.average_allele_frequency);
            if (isNaN(freq)) {
                console.warn("Invalid frequency data for feature:", featureData);
                return;
            }

            const longitude = parseFloat(featureData.longitude);
            const latitude = parseFloat(featureData.latitude);

            if (isNaN(longitude) || isNaN(latitude)) {
                console.warn("Invalid coordinates for feature:", featureData);
                return;
            }

            const marker = new Feature({
                geometry: new Point(fromLonLat([longitude, latitude])),
                average_allele_frequency: freq,
                country: featureData.country || "Unknown",
                admin_level_1: featureData.admin_level_1 || "Unknown",
                gene: featureData.gene || "Unknown",
            });

            marker.setStyle(
                new Style({
                    image: new Icon({
                        src: mv.createPieChartIcon(freq),
                        scale: 0.6,
                    }),
                }),
            );

            mv.alleleVectorSource.addFeature(marker);
        });
    };

    /**
     * Add all allele frequency markers to the map
     */
    mv.addAllAlleleMarkers = () => {
        if (!mv.alleleVectorSource || !mv.features) {
            console.warn("Vector source or features not available");
            return;
        }

        mv.features.forEach((featureData) => {
            const freq = parseFloat(featureData.average_allele_frequency);
            const longitude = parseFloat(featureData.longitude);
            const latitude = parseFloat(featureData.latitude);

            if (isNaN(freq) || isNaN(longitude) || isNaN(latitude)) {
                console.warn("Invalid data for feature:", featureData);
                return;
            }

            const marker = new Feature({
                geometry: new Point(fromLonLat([longitude, latitude])),
                average_allele_frequency: freq,
                country: featureData.country || "Unknown",
                admin_level_1: featureData.admin_level_1 || "Unknown",
                gene: featureData.gene || "Unknown",
            });

            marker.setStyle(
                new Style({
                    image: new Icon({
                        src: mv.createPieChartIcon(freq),
                        scale: 0.6,
                    }),
                }),
            );

            mv.alleleVectorSource.addFeature(marker);
        });
    };

    /**
     * Switch base layer visibility
     * @param {string} selectedLayerName - Name of the layer to make visible
     */
    mv.switchBaseLayer = (selectedLayerName) => {
        if (!selectedLayerName) {
            console.warn("Layer name is required");
            return;
        }

        const getLayer = BaseLayers[selectedLayerName];

        let layerConfig = null;
        if (getLayer.type === "XYZ") {
            layerConfig = {
                source: new XYZ({
                    attributions: getLayer.attributions,
                    url: getLayer.url,
                    maxZoom: 19,
                    tilePixelRatio: 1,
                    preload: "Infinity",
                    opacity: 1,
                }),
            };
        } else {
            layerConfig = {
                source: new OSM(),
                visible: true,
            };
        }
        const newLayer = new TileLayer(layerConfig);
        mv.gMap.getLayers().setAt(0, newLayer);
    };

    /**
     * Set up overlay for tooltips
     * @returns {Overlay} Created overlay instance
     */
    mv.setupOverlay = () => {
        const overlayElement = document.createElement("div");
        overlayElement.className = "ol-popup";
        overlayElement.style.cssText = "background: white; padding: 6px; border: 1px solid #ccc; border-radius: 4px;";

        mv.overlay = new Overlay({
            element: overlayElement,
            offset: [0, -15],
            positioning: "bottom-center",
        });

        return mv.overlay;
    };

    /**
     * Set up pointer move interaction for tooltips
     */
    mv.setupTooltipInteraction = () => {
        if (!mv.gMap) {
            console.warn("Map instance not available");
            return;
        }

        mv.gMap.on("pointermove", (evt) => {
            const feature = mv.gMap.forEachFeatureAtPixel(evt.pixel, (f) => f);

            if (feature && feature.get("average_allele_frequency") !== undefined) {
                const freq = feature.get("average_allele_frequency");
                const country = feature.get("country") || "Unknown";
                const admin = feature.get("admin_level_1") || "Unknown";
                const gene = feature.get("gene") || "Unknown";

                mv.overlay.getElement().innerHTML = `
                    <div style="text-align: center">
                        <img src="${mv.createPieChartIcon(freq)}" width="40" style="margin: auto;" alt="Allele frequency chart" />
                        <br/>
                        <strong>${country}</strong><br/>
                        ${admin}<br/><br/>
                        <hr/>
                        <strong>Allele Frequency:</strong> ${freq.toFixed(3)}<br/>
                        <strong>Gene:</strong> ${gene}<br/><br/>
                    </div>
                `;
                mv.overlay.setPosition(evt.coordinate);
            } else {
                mv.overlay.setPosition(undefined);
            }
        });
    };

    /**
     * Initialize allele frequency map
     * @param {HTMLElement} target - Target DOM element for the map
     * @param {string} dataUrl - URL to the data file
     * @returns {Promise<Map>} OpenLayers Map instance
     */
    mv.initAlleleMap = async (target, featureData) => {
        if (!target) {
            throw new Error("Target element is required");
        }

        try {
            // Create vector source and layer for allele markers
            mv.alleleVectorSource = new Vector();
            mv.alleleVectorLayer = new layer.Vector({ source: mv.alleleVectorSource });

            // Setup overlay
            mv.setupOverlay();

            // Create base layer array
            const newLayer = new TileLayer({
                source: new OSM(),
                visible: true,
            });

            // Create map
            mv.gMap = new Map({
                target: target,
                layers: [newLayer, mv.alleleVectorLayer],
                view: new View({
                    center: fromLonLat([0, 0]),
                    zoom: 2,
                }),
                overlays: [mv.overlay],
            });

            // Load allele data
            mv.features = featureData;

            // Add all markers initially
            mv.addAllAlleleMarkers();

            // Setup tooltip interaction
            mv.setupTooltipInteraction();

            // Handle map resize
            mv.gMap.updateSize();
            const resizeHandler = () => mv.gMap.updateSize();
            window.addEventListener("resize", resizeHandler);

            return mv.gMap;
        } catch (error) {
            console.error("Failed to initialize allele map:", error);
            throw error;
        }
    };

    /**
     * Set the style properties of shapes
     * @param {string} selectedColor - Color for the geometries
     * @returns {Object} Style configuration object
     */
    mv.setStyle = (selectedColor = "#0000ff") => {
        const commonFill = new style.Fill({
            color: "rgba(0, 0, 255, 0.1)",
        });

        const createStroke = (color = selectedColor, width = 1) => new style.Stroke({ color, width });

        const createCircleImage = (radius = 5) =>
            new style.Circle({
                radius,
                fill: commonFill,
                stroke: createStroke(),
            });

        const styles = {
            Polygon: new style.Style({
                stroke: createStroke(),
                fill: commonFill,
            }),
            Circle: new style.Style({
                stroke: createStroke(),
                fill: commonFill,
            }),
            Point: new style.Style({
                image: createCircleImage(),
            }),
            LineString: new style.Style({
                stroke: createStroke(),
            }),
            MultiLineString: new style.Style({
                stroke: createStroke(),
            }),
            MultiPoint: new style.Style({
                image: createCircleImage(),
            }),
            MultiPolygon: new style.Style({
                stroke: createStroke(),
                fill: commonFill,
            }),
            GeometryCollection: new style.Style({
                stroke: createStroke(),
                fill: new style.Fill({ color: selectedColor }),
                image: new style.Circle({
                    radius: 10,
                    fill: null,
                    stroke: createStroke(),
                }),
            }),
        };

        return styles;
    };

    /**
     * Set up events and methods for interactions with map view
     * @param {Vector} source - Vector source for drawing
     * @param {string} geometryColor - Color for drawn geometries
     * @param {string} geometryType - Type of geometry to draw
     */
    mv.setInteractions = (source, geometryColor, geometryType) => {
        if (!mv.gMap || !source) {
            console.warn("Map or source not available");
            return;
        }

        if (geometryType === "None") {
            return;
        }

        const drawInteraction = new interaction.Draw({
            source: source,
            type: geometryType,
            freehand: true,
        });

        drawInteraction.on("drawstart", (event) => {
            const drawStyle = new style.Style({
                stroke: new style.Stroke({
                    color: geometryColor,
                    width: 2,
                }),
                fill: new style.Fill({
                    color: "rgba(0, 0, 255, 0.1)",
                }),
            });
            event.feature.setStyle(drawStyle);
        });

        mv.gMap.addInteraction(drawInteraction);
    };

    /**
     * Export the map view to PNG image
     */
    mv.exportMap = () => {
        if (!mv.gMap) {
            console.warn("Map instance not available");
            return;
        }

        mv.gMap.once("rendercomplete", (event) => {
            const canvas = event.context.canvas;
            const fileName = `map-export-${Date.now()}.png`;

            canvas.toBlob((blob) => {
                if (blob) {
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);
                } else {
                    console.error("Failed to create blob from canvas");
                }
            });
        });

        mv.gMap.renderSync();
    };

    /**
     * Create the map view (legacy method)
     * @param {Vector} vSource - Vector source
     * @param {HTMLElement} target - Target element
     * @param {string} geometryColor - Color for geometries
     * @param {string} geometryType - Type of geometry
     * @param {Function} styleFunction - Style function
     */
    mv.setMap = (vSource, target, geometryColor, geometryType, styleFunction) => {
        if (!target) {
            console.error("Target element is required");
            return;
        }

        const tile = new layer.Tile({ source: new OSM() });
        const fullScreen = new control.FullScreen();
        const scaleLineControl = new control.ScaleLine();

        const vectorLayer = new layer.Vector({
            source: vSource,
            style: styleFunction,
        });

        const view = new View({
            center: [0, 0],
            zoom: 2,
        });

        mv.gMap = new Map({
            controls: control.defaults().extend([scaleLineControl, fullScreen]),
            interactions: interaction.defaults().extend([new interaction.DragRotateAndZoom()]),
            layers: [tile, vectorLayer],
            target: target,
            loadTilesWhileInteracting: true,
            view: view,
        });

        const graticule = new Graticule({
            strokeStyle: new style.Stroke({
                color: "rgba(255, 120, 0, 0.9)",
                width: 2,
                lineDash: [0.5, 4],
            }),
            showLabels: true,
        });

        mv.gMap.addInteraction(new interaction.Modify({ source: vSource }));
        mv.gMap.addControl(new control.ZoomSlider());
        graticule.setMap(mv.gMap);
        mv.setInteractions(vSource, geometryColor, geometryType);
    };

    /**
     * Load the map GeoJson files (legacy method)
     * @param {string} filePath - Path to the file
     * @param {string} fileType - Type of file
     * @param {string} geometryColor - Color for geometries
     * @param {string} geometryType - Type of geometry
     * @param {string} toExport - Export flag
     * @param {HTMLElement} target - Target element
     */
    mv.loadFile = (filePath, fileType, geometryColor, geometryType, toExport, target) => {
        if (!filePath || !target) {
            console.error("File path and target are required");
            return;
        }

        const formatType = new GeoJSON();
        const selectedStyles = mv.setStyle(geometryColor);
        const styleFunction = (feature) => {
            const geomType = feature.getGeometry().getType();
            return selectedStyles[geomType] || selectedStyles.Point;
        };

        if (toExport === "export") {
            mv.exportMap();
        }

        if (fileType === "geojson") {
            const sourceVec = new Vector({
                format: formatType,
                url: filePath,
                wrapX: false,
            });
            mv.createMap(sourceVec, geometryColor, geometryType, styleFunction, target);
        } else {
            console.warn(`Unsupported file type: ${fileType}`);
        }
    };

    /**
     * Create map (legacy method)
     * @param {Vector} sourceVec - Vector source
     * @param {string} geometryColor - Color for geometries
     * @param {string} geometryType - Type of geometry
     * @param {Function} styleFunction - Style function
     * @param {HTMLElement} target - Target element
     */
    mv.createMap = (sourceVec, geometryColor, geometryType, styleFunction, target) => {
        mv.setMap(sourceVec, target, geometryColor, geometryType, styleFunction);
    };

    return mv;
}
