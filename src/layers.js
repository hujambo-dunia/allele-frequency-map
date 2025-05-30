/* WATCH AND LEARN:
https://www.youtube.com/watch?v=UAQogFwyna0
*/

/* Map Layers for OpenLayers
ESRI World Imagery is not open source, but available for non-commercial public use. Use with caution for academic/demo purposes. For speciality maps & pricing see:
* https://github.com/Esri/esri-leaflet-vector
* https://developers.arcgis.com/esri-leaflet/samples/showing-a-basemap/
* https://developers.arcgis.com/rest/basemap-styles/#pricing
*/

import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import OSM from "ol/source/OSM";

export const mapLayers = {
    /* License: Open Database License (ODbL)
    Notes: The default go-to for OpenLayers. Simple, minimal, and reliable. */
    OpenStreetMap: new TileLayer({
        source: new OSM(),
        visible: true,
    }),
    /* OpenTopoMap License: Creative Commons BY-NC-SA 4.0
    Use: Great for terrain and hiking overlays.
    Note: Attribution required. May not be allowed for commercial use. */
    /* https://opentopomap.org/about */
    /* https://opentopomap.org/about#license */
    OpenTopoMap: new TileLayer({
        source: new XYZ({
            url: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
            attributions: 'Map data: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        }),
        visible: false,
    }),
    /* Carto License: Open for fair use with attribution */
    /* https://carto.com/attributions */
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
    // "Stamen Toner Lite": new TileLayer({
    //     source: new XYZ({
    //         url: 'https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png',
    //         attributions: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
    //                     'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. ' +
    //                     'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under ODbL.',
    //     }),
    // }),
    /* License: Esri World Imagery is not open source, but available for non-commercial public use. Use with caution for academic/demo purposes */
    /* https://www.esri.com/en-us/home/terms-of-use */
    "Esri World Imagery": new TileLayer({
        source: new XYZ({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            maxZoom: 19,
            tilePixelRatio: 1,
            attributions: '&copy; <a href="https://www.esri.com">Esri</a>, Earthstar Geographics',
        }),
        preload: Infinity, // optional: loads beyond current extent
        opacity: 1,
        visible: false,
    }),
    /* License: Esri World Imagery is not open source, but available for non-commercial public use. Use with caution for academic/demo purposes */
    /* https://www.esri.com/en-us/home/terms-of-use */
    "Esri Topo": new TileLayer({
        source: new XYZ({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
            maxZoom: 19,
            tilePixelRatio: 1,
            attributions: '&copy; <a href="https://www.esri.com">Esri</a>, Earthstar Geographics',
        }),
        preload: Infinity, // optional: loads beyond current extent
        opacity: 1,
        visible: false,
    }),
    /* License: Esri World Imagery is not open source, but available for non-commercial public use. Use with caution for academic/demo purposes */
    /* https://www.esri.com/en-us/home/terms-of-use */
    "Esri NEW": new TileLayer({
        source: new XYZ({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
            maxZoom: 19,
            tilePixelRatio: 1,
            attributions: '&copy; <a href="https://www.esri.com">Esri</a>, Earthstar Geographics',
        }),
        preload: Infinity, // optional: loads beyond current extent
        opacity: 1,
        visible: false,
    }),
    /* License: Esri World Imagery is not open source, but available for non-commercial public use. Use with caution for academic/demo purposes */
    /* https://www.esri.com/en-us/home/terms-of-use */
    "Esri Nat Geo World (deprecated?)": new TileLayer({
        source: new XYZ({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
            maxZoom: 19,
            tilePixelRatio: 1,
            attributions: '&copy; <a href="https://www.esri.com">Esri</a>, Earthstar Geographics',
        }),
        preload: Infinity, // optional: loads beyond current extent
        opacity: 1,
        visible: false,
    }),
    /* License: Esri World Imagery is not open source, but available for non-commercial public use. Use with caution for academic/demo purposes */
    /* https://www.esri.com/en-us/home/terms-of-use */
    "Esri World Physical (low-zoom)": new TileLayer({
        source: new XYZ({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
            maxZoom: 19,
            tilePixelRatio: 1,
            attributions: '&copy; <a href="https://www.esri.com">Esri</a>, Earthstar Geographics',
        }),
        preload: Infinity, // optional: loads beyond current extent
        opacity: 1,
        visible: false,
    }),
};
