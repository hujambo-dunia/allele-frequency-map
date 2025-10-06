import { createApp, h } from "vue";
import App from "./App.vue";
import "./style.css";

async function main() {
    try {
        const scriptUrl = new URL(import.meta.url);
        const container = scriptUrl.searchParams.get("container") || "app";

        if (import.meta.env.DEV) {
            const { parseXML } = await import("galaxy-charts-xml-parser");
            const dataIncoming = {
                visualization_config: {
                    dataset_id: process.env.dataset_id || "unavailable",
                    settings: {},
                },
                visualization_plugin: await parseXML("allele_frequency_map.xml"),
            };
            const appElement = document.getElementById(container);

            if (appElement) {
                appElement.dataset.incoming = JSON.stringify(dataIncoming);
            } else {
                console.error(`Container element with id "${container}" not found`);
            }
        }

        createApp({
            render: () =>
                h(App, {
                    container: container,
                    credentials: process.env.credentials,
                }),
        }).mount(`#${container}`);
    } catch (error) {
        console.error("Failed to initialize application:", error);
    }
}

main();
