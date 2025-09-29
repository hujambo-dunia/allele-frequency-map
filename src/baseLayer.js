import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import OSM from "ol/source/OSM";

export const baseLayer = {
    /* License: Open Database License (ODbL)
    Notes: The default go-to for OpenLayers. Simple, minimal, and reliable. */
    OpenStreetMap: new TileLayer({
        source: new OSM(),
        visible: true,
    }),
    /* OpenTopoMap License: Creative Commons BY-NC-SA 4.0
    Use: Great for terrain and hiking overlays.
    Note: Attribution required. May not be allowed for commercial use. https://opentopomap.org/about
    https://opentopomap.org/about#license */
    OpenTopoMap: new TileLayer({
        source: new XYZ({
            url: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
            attributions: 'Map data: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        }),
        visible: false,
    }),
    /* Carto License: Open for fair use with attribution
    https://carto.com/attributions */
    "Carto Light": new TileLayer({
        source: new XYZ({
            url: "https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            attributions: '&copy; <a href="https://carto.com/">CARTO</a>',
        }),
        visible: false,
    }),
    "Carto Dark": new TileLayer({
        source: new XYZ({
            url: "https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            attributions: '&copy; <a href="https://carto.com/">CARTO</a>',
        }),
        visible: false,
    }),
    /* License: Esri World Imagery is not open source, but available for non-commercial public use. Use with caution for academic/demo purposes
    https://www.esri.com/en-us/home/terms-of-use */
    "Esri World Imagery": new TileLayer({
        source: new XYZ({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            maxZoom: 19,
            tilePixelRatio: 1,
            attributions: '&copy; <a href="https://www.esri.com">Esri</a>, Earthstar Geographics',
        }),
        preload: Infinity,
        opacity: 1,
        visible: false,
    }),
    /* License: Esri World Physical map may be limited to low-zoom
    https://www.esri.com/en-us/home/terms-of-use */
    "Esri World Physical": new TileLayer({
        source: new XYZ({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
            maxZoom: 19,
            tilePixelRatio: 1,
            attributions: '&copy; <a href="https://www.esri.com">Esri</a>, Earthstar Geographics',
        }),
        preload: Infinity,
        opacity: 1,
        visible: false,
    }),
    /* License: Esri World Imagery is not open source, but available for non-commercial public use. Use with caution for academic/demo purposes
    https://www.esri.com/en-us/home/terms-of-use */
    "Esri Topo": new TileLayer({
        source: new XYZ({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
            maxZoom: 19,
            tilePixelRatio: 1,
            attributions: '&copy; <a href="https://www.esri.com">Esri</a>, Earthstar Geographics',
        }),
        preload: Infinity,
        opacity: 1,
        visible: false,
    }),
    /* License: Esri National Geographic World map deprecated version
    https://www.esri.com/en-us/home/terms-of-use */
    "Esri Nat Geo World": new TileLayer({
        source: new XYZ({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
            maxZoom: 19,
            tilePixelRatio: 1,
            attributions: '&copy; <a href="https://www.esri.com">Esri</a>, Earthstar Geographics',
        }),
        preload: Infinity,
        opacity: 1,
        visible: false,
    }),
};
