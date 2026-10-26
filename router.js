const fs = require("fs");
const path = require("path");
const { authVisitorHandler } = require("./handlers/auth-visitor");
const { loginHandler } = require("./handlers/login");
const {
    listTicketTypesHandler,
    purchaseTicketHandler,
    listMyTicketsHandler,
    membershipStatusHandler
} = require("./handlers/tickets");
const {
    ticketSalesByTypeHandler,
    dailyTicketSalesHandler,
    visitorPurchaseSummaryHandler
} = require("./handlers/ticket-reports");
const {
    getVisitorProfileHandler,
    updateVisitorProfileHandler
} = require("./handlers/visitor-profile");
const {
    listProductsHandler,
    createProductHandler,
    updateProductHandler
} = require("./handlers/gift-shop/products");

const { logoutHandler } = require("./handlers/logout");
const { listArtworkForVisitorHandler,
        readArtworkForVisitorHandler 
} = require("./handlers/artwork");
const { createArtistHandler,
        listArtistsHandler,
        readArtistHandler,
        updateArtistHandler,
        deleteArtistHandler,
        listArtistLookupHandler
 } = require("./handlers/curator/artists");
const { createArtworkHandler,
        listArtworkHandler,
        readArtworkHandler,
        updateArtworkHandler,
        deleteArtworkHandler
 } = require("./handlers/curator/artwork");
const { listArtworkLookupsHandler } = require("./handlers/curator/artwork-lookup");
const { createCollectionHandler,
        listCollectionsHandler,
        readCollectionHandler,
        updateCollectionHandler,
        deleteCollectionHandler
} = require("./handlers/curator/collections");
const { createExhibitionHandler,
    listExhibitionHandler,
    readExhibitionHandler,
    updateExhibitionHandler,
    deleteExhibitionHandler
} = require("./handlers/exhibitions");
const { registerVisitorHandler } = require("./handlers/register-visitor");
const { purchaseMembershipHandler } = require("./handlers/membership-purchase");

const { 
    listPersonnelHandler,
    createPersonnelHandler
} = require("./handlers/director/personnel");

const {
    createTierHandler,
    listTiersHandler,
    listBenefitsHandler,
    readTierHandler,
    updateTierHandler,
    deleteTierHandler
} = require("./handlers/director/memberships");
const { getTopArtistsHandler } = require("./handlers/curator/analytics");

async function router(req, res) {
    try {
        // POST routing starts here
        if (req.method === "POST" && req.url === "/api/auth-visitor") {
            await authVisitorHandler(req, res);
            return;
        }

        if (req.method === "POST" && req.url === "/api/register-visitor") {
            await registerVisitorHandler(req, res);
            return;
        }

        if (req.method === "POST" && req.url === "/api/membership-purchase") {
            await purchaseMembershipHandler(req, res);
            return;
        }

        if (req.method === "POST" && req.url === "/api/login") {
            await loginHandler(req, res);
            return;
        }

        if (req.method === "POST" && req.url === "/api/logout") {
            await logoutHandler(req, res);
            return;
        }

        if (req.method === "POST" && req.url === "/api/director/personnel") {
            if (!requireDirector(req, res)) return;
            await createPersonnelHandler(req, res);
            return;
        }

        if (req.method === "POST" && req.url === "/api/director/memberships/tiers") {
            if (!requireDirector(req, res)) return;
            await createTierHandler(req, res);
            return;
        }

        // GET - HTML file routing starts here
        if (req.method === "GET" && req.url === "/gift-shop/dashboard") {
            if (!requireGiftShopManager(req, res)) return;

            sendPage(
                res,
                path.join("gift-shop", "dashboard.html"),
                "text/html"
            );
            return;
        }

        if (req.method === "GET" && req.url === "/gift-shop/products") {
            if (!requireGiftShopManager(req, res)) return;

            sendPage(
                res,
                path.join("gift-shop", "products.html"),
                "text/html"
            );
            return;
        }
        if (req.method === "GET" && req.url === "/js/gift-shop-products.js") {
            if (!requireGiftShopManager(req, res)) return;

            sendPage(
                res,
                path.join("js", "gift-shop-products.js"),
                "application/javascript"
            );
            return;
        }
        if (req.method === "GET" && req.url === "/api/gift-shop/products") {
            if (!requireGiftShopManager(req, res)) return;

            await listProductsHandler(req, res);
            return;
        }
        if (req.method === "POST" && req.url === "/api/gift-shop/products") {
            if (!requireGiftShopManager(req, res)) return;

            await createProductHandler(req, res);
            return;
        }
        const productUpdateMatch = new URL(req.url, "http://localhost")
            .pathname.match(/^\/api\/gift-shop\/products\/(\d+)$/);

        if (req.method === "PUT" && productUpdateMatch) {
            if (!requireGiftShopManager(req, res)) return;

            req.params = {
                id: productUpdateMatch[1]
            };

            await updateProductHandler(req, res);
            return;
        }
        if (req.method === "GET" && (req.url === "/" || req.url === "/home")) {
            sendVisitorPage(req, res, "index.html");
            return;
        }

        if (req.method === "GET" && req.url === "/artwork") {
            sendVisitorPage(req, res, "artwork.html");
            return;
        }    

        if (req.method === "GET" && req.url === "/api/artwork") {
            await listArtworkForVisitorHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/collections") {
            sendVisitorPage(req, res, "collections.html");
            return;
        }

        if (req.method === "GET" && req.url === "/membership") {
            sendVisitorPage(req, res, "memberships.html");
            return;
        }

        if (req.method === "GET" && req.url === "/exhibitions") {
            sendVisitorPage(req, res, "exhibitions.html");            
            return;
        }

        if (req.method === "GET" && req.url === "/ticketing") {
            sendVisitorPage(req, res, "ticketing.html");
            return;
        }

        if (req.method === "GET" && req.url === "/ticket-history") {
            sendPage(res, "ticket-history.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/visitor-profile") {
            sendPage(res, "visitor-profile.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/api/ticket-types") {
            await listTicketTypesHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/membership-status") {
            await membershipStatusHandler(req, res);
            return;
        }

        if (req.method === "POST" && req.url === "/api/tickets") {
            await purchaseTicketHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/my-tickets") {
        await listMyTicketsHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/visitor-profile") {
            await getVisitorProfileHandler(req, res);
            return;
        }

        if (req.method === "PUT" && req.url === "/api/visitor-profile") {
            await updateVisitorProfileHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/ticket-reports/sales") {
            if (!requireDirector(req, res)) return;
            await ticketSalesByTypeHandler(req, res);
            return;
        }   

        if (req.method === "GET" && req.url === "/api/ticket-reports/daily") {
            if (!requireDirector(req, res)) return;
            await dailyTicketSalesHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/ticket-reports/visitors") {
            if (!requireDirector(req, res)) return;
            await visitorPurchaseSummaryHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/director/memberships/tiers") {
            if (!requireDirector(req, res)) return;
            await listTiersHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/director/memberships/benefits") {
            if (!requireDirector(req, res)) return;
            await listBenefitsHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/about") {
            sendVisitorPage(req, res, "about.html");
            return;
        }

        if (req.method === "GET" && req.url === "/auth-visitor") {
            sendPage(res, "auth-visitor.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/auth-staff") {
            sendPage(res, "auth-staff.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/style") {
            sendPage(res, "style.css", "text/css");
            return;
        }

        if (req.method === "GET" && req.url === "/curator/artwork") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("curator", "artwork.html"), "text/html");
            return;
        }      

        if (req.method === "GET" && req.url === "/curator/artists") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("curator", "artists.html"), "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/curator/collections") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("curator", "collections.html"), "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/curator/exhibitions") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("curator", "exhibitions.html"), "text/html");
            return;
        }

        // Client script file routing starts here
        if (req.method === "GET" && req.url === "/js/index.js") {
            sendPage(res, path.join("js", "index.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/login.js") {
            sendPage(res, path.join("js", "login.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/auth-visitor.js") {
            sendPage(res, path.join("js", "auth-visitor.js"), "application/javascript");
            return;
        }
        
        if (req.method === "GET" && req.url === "/js/register-visitor.js") {
            sendPage(res, path.join("js", "register-visitor.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/artwork.js") {
            sendPage(res, path.join("js", "artwork.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/artwork-detail.js") {
            sendPage(res, path.join("js", "artwork-detail.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/collections.js") {
            sendPage(res, path.join("js", "collections.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/exhibitions.js") {
            sendPage(res, path.join("js", "exhibitions.js"), "application/javascript");            
            return;
        }

        if (req.method === "GET" && req.url === "/js/memberships.js") {
            sendPage(res, path.join("js", "memberships.js"), "application/javascript");
            return;
        }
        
        if (req.method === "GET" && req.url === "/js/membership-detail.js") {
            sendPage(res, path.join("js", "membership-detail.js"), "application/javascript");
            return;
        }   

        // Curator dashboard routing starts here
        if (req.method === "GET" && req.url === "/js/curator-artists.js") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("js", "curator-artists.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/curator-artwork.js") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("js", "curator-artwork.js"), "application/javascript");
            return;
        }    

        if (req.method === "GET" && req.url === "/js/curator-collections.js") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("js", "curator-collections.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/curator-exhibitions.js") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("js", "curator-exhibitions.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/drawer.js") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("js", "drawer.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/form-state.js") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("js", "form-state.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/curator/analytics") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("curator", "analytics.html"), "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/js/curator-analytics.js") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("js", "curator-analytics.js"), "application/javascript");
            return;
        }

        if (req.method === "POST" && req.url === "/api/curator/artists") {
            if (!requireCurator(req, res)) return;
            await createArtistHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/curator/artists") {
            if (!requireCurator(req, res)) return;
            await listArtistsHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/curator/artist-lookup") {
            if (!requireCurator(req, res)) return;
            await listArtistLookupHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/curator/artwork-lookup") {
            if (!requireCurator(req, res)) return;
            await listArtworkLookupsHandler(req, res);
            return;
        }          

        if (req.method === "POST" && req.url === "/api/curator/artwork") {
            if (!requireCurator(req, res)) return;
            await createArtworkHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/curator/artwork") {
            if (!requireCurator(req, res)) return;
            await listArtworkHandler(req, res);
            return;
        }
        
        if (req.method === "POST" && req.url === "/api/curator/collections") {
            if (!requireCurator(req, res)) return;
            await createCollectionHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/collections") {
            await listCollectionsHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/memberships/tiers") {
            await listTiersHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/exhibitions") {
            await listExhibitionHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/curator/collections") {
            if (!requireCurator(req, res)) return;
            await listCollectionsHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/exhibitions") {
            await listExhibitionHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/curator/exhibitions") {
            if (!requireCurator(req, res)) return;
            await listExhibitionHandler(req, res);
            return;
        }
        
        if (req.method === "GET" && req.url === "/api/director/exhibitions") {
            if (!requireDirector(req, res)) return;
            await listExhibitionHandler(req, res);
            return
        }

        if (req.method === "POST" && req.url === "/api/director/exhibitions") {
            if (!requireDirector(req, res)) return;
            await createExhibitionHandler(req, res);
            return;
        }

// Director personnel Dashboard routing starts here
        if (req.method === "GET" && req.url === "/director/dashboard") {
            if (!requireDirector(req, res)) return;
            sendPage(res, path.join("director", "dashboard.html"), "text/html");
            return;
        }
        
        if (req.method === "GET" && req.url === "/director/memberships") {
            if (!requireDirector(req, res)) return;
            sendPage(res, path.join("director", "memberships.html"), "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/api/director/personnel") {
            if (!requireDirector(req, res)) return;
            await listPersonnelHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/js/director-personnel.js") {
            if (!requireDirector(req, res)) return;
            sendPage(res, path.join("js", "director-personnel.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/director-memberships.js") {
            if (!requireDirector(req, res)) return;
            sendPage(res, path.join("js", "director-memberships.js"), "application/javascript");
            return;
        }

        const pathname = new URL(req.url, "http://localhost").pathname;

        if (req.method === "GET" && pathname.match(/^\/membership\/\d+$/)) {
            sendVisitorPage(req, res, "membership-detail.html");
            return;
        }

        if (req.method === "GET" &&
            pathname.match(/^\/curator\/artists\/\d+$/)
        ) {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("curator", "artist-detail.html"), "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/js/curator-artist-detail.js") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("js", "curator-artist-detail.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/components/artist-form.html") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("components", "artist-form.html"), "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/components/collection-form.html") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("components", "collection-form.html"), "text/html");
            return;
        }

        if (req.method === "GET" && pathname === "/auth-visitor") {
            sendPage(res, "auth-visitor.html", "text/html");
            return;
        }

        if (req.method === "GET" && pathname === "/register-visitor") {
            sendPage(res, "register-visitor.html", "text/html");
            return;
        }

        if (req.method === "GET" &&
            pathname === "/membership-checkout"
        ) {
            if (!requireRegisteredUser(req, res)) return;
            sendVisitorPage(req, res, "membership-checkout.html");
            return;
        }

        if (req.method === "GET" && 
            pathname.match(/^\/curator\/artwork\/\d+$/)
        ) {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("curator", "artwork-detail.html"), "text/html");
            return;
        }

        if (req.method === "GET" &&
            pathname.match(/^\/curator\/collections\/\d+$/)
        ) {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("curator", "collection-detail.html"), "text/html");
            return;
        }

        if (req.method === "GET" &&
            pathname.match(/^\/curator\/exhibitions\/\d+$/)
        ) {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("curator", "exhibition-detail.html"), "text/html");
            return;
        }

        if (req.method === "GET" && 
            pathname.match(/^\/artwork-detail\/\d+$/)
        ) {
            sendVisitorPage(req, res, "artwork-detail.html");
            return;
        }

        if (req.method === "GET" && req.url === "/js/curator-artwork-detail.js") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("js", "curator-artwork-detail.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/curator-collection-detail.js") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("js", "curator-collection-detail.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/curator-exhibition-detail.js") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("js", "curator-exhibition-detail.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/components/artwork-form.html") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("components", "artwork-form.html"), "text/html");
            return;
        }

        const artistMatch = pathname.match(/^\/api\/curator\/artists\/(\d+)$/);
        const artworkMatch = pathname.match(/^\/api\/curator\/artwork\/(\d+)$/);
        const collectionMatch = pathname.match(/^\/api\/curator\/collections\/(\d+)$/);
        const exhibitionMatch = pathname.match(/^\/api\/curator\/exhibitions\/(\d+)$/);
        
        const artworkMatchVisitor = pathname.match(/^\/api\/artwork-detail\/(\d+)$/);

        const tierMatch = pathname.match(/^\/api\/director\/memberships\/tiers\/(\d+)$/);
        const tierMatchVisitor = pathname.match(/^\/api\/membership-detail\/(\d+)$/);

        if (artistMatch && ["GET", "PUT", "DELETE"].includes(req.method)) {
            req.params = { id: artistMatch[1] };

            if (!requireCurator(req, res)) return;

            if (req.method === "GET") {
                await readArtistHandler(req, res);
            } else if (req.method === "PUT") {
                await updateArtistHandler(req, res);
            } else {
                await deleteArtistHandler(req, res);
            }
            return;
        }

        if (artworkMatch && ["GET", "PUT", "DELETE"].includes(req.method)) {
            req.params = { id: artworkMatch[1] };

            if (!requireCurator(req, res)) return;

            if (req.method === "GET") {
                await readArtworkHandler(req, res);
            } else if (req.method === "PUT") {
                await updateArtworkHandler(req, res);
            } else if (req.method === "DELETE") {
                await deleteArtworkHandler(req, res);
            } else return;
            return;
        }

        if (collectionMatch && ["GET", "PUT", "DELETE"].includes(req.method)) {
            req.params = { id: collectionMatch[1] };

            if (!requireCurator(req, res)) return;

            if (req.method === "GET") {
                await readCollectionHandler(req, res);
            } else if (req.method === "PUT") {
                await updateCollectionHandler(req, res);
            } else if (req.method === "DELETE"){
                await deleteCollectionHandler(req, res);
            } else return;
            return;
        }

        if (exhibitionMatch && ["GET", "PUT", "DELETE"].includes(req.method)) {
            req.params = { id: exhibitionMatch[1] };

            if (!requireCurator(req, res)) return;

            if (req.method === "GET") {
                await readExhibitionHandler(req, res);
            } else if (req.method === "PUT") { 
                await updateExhibitionHandler(req, res);
            } else if (req.method === "DELETE") {
                await deleteExhibitionHandler(req, res);
            } else return;
            return;
        }

        if (artworkMatchVisitor && req.method === "GET") {
            req.params = { id: artworkMatchVisitor[1] };
            await readArtworkForVisitorHandler(req, res);
            return;
        } 
        
        if (tierMatch && ["GET", "PUT", "DELETE"].includes(req.method)) {
            req.params = { id: tierMatch[1] };

            if (!requireDirector(req, res)) return;

            if (req.method === "GET") {
                await readTierHandler(req, res);
            } else if (req.method === "PUT") {
                await updateTierHandler(req, res);
            } else if (req.method === "DELETE") {
                await deleteTierHandler(req, res);
            } else return;
            return;
        }

        if (tierMatchVisitor && req.method === "GET") {
            req.params = { id: tierMatchVisitor[1] };
            await readTierHandler(req, res);
            return;
        }

        if (req.method === "GET" && pathname === "/api/me") {
            if (!req.user) {
                res.writeHead(401, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    authenticated: false
                }));

                return;
            }

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                authenticated: true,
                user: {
                    id: req.user.id,
                    userType: req.user.userType,
                    VisitorID: req.user.VisitorID
                }
        }));

        // curator analytics routing

        if (req.method === "GET" && req.url.startsWith("/api/curator/analytics/artworks")) {
            if (!requireCurator(req, res)) return;
            return getTopArtworksHandler(req, res);
        }

        if (req.method === "GET" && req.url.startsWith("/api/curator/analytics/artists")) {
            if (!requireCurator(req, res)) return;
            return getTopArtistsHandler(req, res);
        }

        if (req.method === "GET" && req.url.startsWith("/api/curator/analytics/styles")) {
            if (!requireCurator(req, res)) return;
            return getTopStylesHandler(req, res);
        }

        if (req.method === "GET" && req.url.startsWith("/api/curator/analytics/periods")) {
            if (!requireCurator(req, res)) return;
            return getTopPeriodsHandler(req, res);
        }

        if (req.method === "GET" && req.url.startsWith("/api/curator/analytics/collections")) {
            if (!requireCurator(req, res)) return;
            return getTopCollectionsHandler(req, res);
        }

        if (req.method === "GET" && req.url.startsWith("/api/curator/analytics/artwork-by-tier")) {
            if (!requireCurator(req, res)) return;
            return getArtworkInterestByTierHandler(req, res);
        }

        if (req.method === "GET" && req.url.startsWith("/api/curator/analytics/artist-by-tier")) {
            if (!requireCurator(req, res)) return;
            return getArtistInterestByTierHandler(req, res);
        }

        if (req.method === "GET" && req.url.startsWith("/api/curator/analytics/monthly-engagement")) {
            if (!requireCurator(req, res)) return;
            return getMonthlyEngagementHandler(req, res);
        }

        if (req.method === "GET" && req.url.startsWith("/api/curator/analytics/session-engagement")) {
            if (!requireCurator(req, res)) return;
            return getSessionEngagementHandler(req, res);
        }

        if (req.method === "GET" && req.url.startsWith("/api/curator/analytics/top-sessions")) {
            if (!requireCurator(req, res)) return;
            return getTopSessionsHandler(req, res);
        }

        if (req.method === "GET" && req.url.startsWith("/api/curator/analytics/recommendations")) {
            if (!requireCurator(req, res)) return;
            return getExhibitionRecommendationsHandler(req, res);
        }

    return;
}

        // Images routing
        if (req.method === "GET" && req.url.startsWith("/images/")) {
            const filename = path.basename(req.url);

            const ext = path.extname(filename).toLowerCase();
            let contentType = "application/octet-stream";

            if (ext === '.webp') contentType = 'image/webp';
            else if (ext === '.png') contentType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
            else if (ext === '.gif') contentType = 'image/gif';
            
            sendPage(res, path.join("images", filename), contentType);
            return;
        }

        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 - Page Not Found</h1>");
    } catch (error) {
        console.error(error);

        if (!res.headersSent) {
            const statusCode = error.statusCode || (error instanceof TypeError ? 400 : 500);

            res.writeHead(statusCode, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: error.message }));
        } else {
            res.end();
        }
    }
}

function sendPage(res, filename, contentType) {
    const filePath = path.join(__dirname, "public", filename);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Server error");
            return;
        }

        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
}

function requireAdmin(req, res) {
    if (!req.user || req.user.role !== "admin") {
        res.writeHead(302, {
            "Location": "/",
            "Content-Length": 0
        });
        res.end();
        return false;
    }
    return true;
}

function requireCurator(req, res) {
    if (!req.user || req.user.role !== "curator") {
        res.writeHead(302, {
            "Location": "/",
            "Content-Length": 0
        });
        res.end();
        return false;
    }
    return true;
}

function requireDirector(req, res) {
    if (!req.user || req.user.role !== "director") {
        res.writeHead(302, {
            "Location": "/",
            "Content-Length": 0
        });
        res.end();
        return false;
    }
    return true;
}
function requireGiftShopManager(req, res) {
    if (!req.user || req.user.role !== "gift_shop_manager") {
        res.writeHead(302, {
            "Location": "/",
            "Content-Length": 0
        });
        res.end();
        return false;
    }

    return true;
}

function requireRegisteredUser(req, res) {
    if (!req.user || !["visitor", "member"].includes(req.user.userType)) {
        res.writeHead(302, {
            "Location": "/",
            "Content-Length": 0
        });
        res.end();
        return false;
    }

    return true;
}

function sendVisitorPage(req, res, filename) {
    const filePath = path.join(__dirname, "public", filename);

    fs.readFile(filePath, "utf8", (err, html) => {
        if (err) {
            console.error(`Failed to read visitor page: ${filePath}`, err);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Server error");
            return;
        }

        const placeholder = "<!-- VISITOR_AUTH -->";

        if (!html.includes(placeholder)) {
            console.error(`Visitor auth placeholder not found in: ${filePath}`);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Page configuration error");
            return;
        }

        const authControl = req.user
            ? `<form class="header-auth-form" action="/api/logout" method="post">
                   <button class="header-auth" type="submit">Log Out</button>
               </form>`
            : `<a class="header-auth" href="/auth-visitor">Sign In</a>`;

        const renderedHtml = html.replace(placeholder, authControl);

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(renderedHtml);
    });
}

module.exports = router;
