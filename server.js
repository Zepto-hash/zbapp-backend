const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const inventoryRegistry = {
    "britannia-cheese-slices": { title: "Britannia Cheese Slices (200g)", basePrice: 145, sku: "ZP-77412" },
    "amul-butter": { title: "Amul Pasteurised Butter (100g)", basePrice: 58, sku: "ZP-11029" },
    "coca-cola-750ml": { title: "Coca-Cola Soft Drink (750ml)", basePrice: 40, sku: "ZP-99381" }
};

app.post('/api/build-payload', (req, res) => {
    const { targetUrl, tgUser } = req.body;

    if (!targetUrl) {
        return res.status(400).json({ success: false, error: "Link container is blank" });
    }

    try {
        const slugExtraction = targetUrl.split('/item/')[1];
        const cleanedSlug = slugExtraction ? slugExtraction.split('?')[0].trim() : null;

        if (!cleanedSlug || !inventoryRegistry[cleanedSlug]) {
            return res.status(404).json({
                success: false,
                error: "Target product parameters unrecognized. Try pasting a link containing: 'amul-butter', 'britannia-cheese-slices', or 'coca-cola-750ml'"
            });
        }

        const primaryProduct = inventoryRegistry[cleanedSlug];

        const automatedFreebiePayload = {
            title: "🎁 Referral Bonus Reward (Welcome Snack Pack)",
            sku: "REF-FREEBIE-2026",
            cost: 0,
            status: "Injected"
        };

        const consolidatedOrderPayload = {
            accountOwner: tgUser || "Anonymous_User",
            timestamp: new Date().toISOString(),
            routingChannel: "TELEGRAM_MINI_APP_RELAY",
            cartManifest: [
                { itemSku: primaryProduct.sku, name: primaryProduct.title, price: primaryProduct.basePrice, quantity: 1 },
                { itemSku: automatedFreebiePayload.sku, name: automatedFreebiePayload.title, price: automatedFreebiePayload.cost, quantity: 1 }
            ],
            promoValidation: {
                activeCouponCode: "ZBAPP_FREE_PASS",
                discountDeduction: 0,
                deliveryFee: 0
            },
            financialTotals: {
                subtotal: primaryProduct.basePrice,
                netPayable: primaryProduct.basePrice
            }
        };

        res.json({
            success: true,
            message: "Referral payload generated and stitched successfully!",
            payload: consolidatedOrderPayload
        });

    } catch (err) {
        res.status(500).json({ success: false, error: "Processing runtime failure" });
    }
});

const SERVER_PORT = process.env.PORT || 3000;
app.listen(SERVER_PORT, () => {
    console.log(`ZBAPP automation server active on port ${SERVER_PORT}`);
});
