import { createApp, h } from "vue";
import App from "./Plugin.vue";
import "./style.css";

async function main() {
    try {
        const scriptUrl = new URL(import.meta.url);
        const container = scriptUrl.searchParams.get("container") || "app";
        const appElement = document.getElementById(container);

        if (import.meta.env.DEV) {
            const dataIncoming = {
                visualization_config: {
                    dataset_id: process.env.dataset_id,
                    settings: {},
                },
            };
            if (appElement) {
                appElement.dataset.incoming = JSON.stringify(dataIncoming);
            } else {
                console.error(`Container element with id "${container}" not found`);
            }
        }

        const { root, visualization_config } = JSON.parse(appElement.dataset.incoming);
        createApp({
            render: () =>
                h(App, {
                    root: root,
                    datasetId: visualization_config.dataset_id,
                    settings: visualization_config.settings,
                }),
        }).mount(`#${container}`);
    } catch (error) {
        console.error("Failed to initialize application:", error);
    }
}

main();
