import { test, expect } from "@playwright/test";
import DATASET_CONTENT from "./test-data/1.freq.json" with { type: "json" };

const maxDiffPixelRatio = 0.05;

test("basic", async ({ page }) => {
    await page.route("**/api/datasets/__test__/display", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(DATASET_CONTENT),
        });
    });

    await page.goto("http://localhost:5173?dataset_id=__test__");
    await page.waitForSelector("div:text('Filter data by gene.')");
    await expect(page).toHaveScreenshot("basic.png", { maxDiffPixelRatio });
});
