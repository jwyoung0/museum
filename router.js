const fs = require("fs");
const path = require("path");
const { authVisitorHandler } = require("./handlers/auth-visitor");
const { loginHandler } = require("./handlers/login");
const { listTicketTypesHandler, purchaseTicketHandler } = require("./handlers/tickets");

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

const {
    listPersonnelHandler,
    createPersonnelHandler
} = require("./handlers/director/personnel");

async function router(req, res) {
    try {
        // POST routing starts here
        if (req.method === "POST" && req.url === "/api/auth-visitor") {
            await authVisitorHandler(req, res);
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

        // GET - HTML file routing starts here
        if (req.method === "GET" && (req.url === "/" || req.url === "/home")) {
            sendVisitorPage(req, res, "index.html");
            // sendPage(res, "index.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/admin-dashboard") {
            if (!requireAdmin(req, res)) return;
            sendPage(res, "admin-dashboard.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/artwork") {
            sendVisitorPage(req, res, "artwork.html");
            // sendPage(res, "artwork.html", "text/html");
            return;
        }

        // if (req.method === "GET" && req.url === "/artwork-detail") {
        //     sendVisitorPage(req, res, "artwork-detail.html");
        //     // sendPage(res, "artwork.html", "text/html");
        //     return;
        // }        

        if (req.method === "GET" && req.url === "/api/artwork") {
            await listArtworkForVisitorHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/collections") {
            sendVisitorPage(req, res, "collections.html");
            // sendPage(res, "collections.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/exhibitions") {
            sendVisitorPage(req, res, "exhibitions.html");            
            return;
        }

        if (req.method === "GET" && req.url === "/ticketing") {
            sendPage(res, "ticketing.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/api/ticket-types") {
            await listTicketTypesHandler(req, res);
            return;
        }

        if (req.method === "POST" && req.url === "/api/tickets") {
            await purchaseTicketHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/about") {
            sendVisitorPage(req, res, "about.html");
            // sendPage(res, "about.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/auth-visitor") {
            sendPage(res, "auth-visitor.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/auth-create-account") {
            sendPage(res, "auth-create-account.html", "text/html");
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
        if (req.method === "GET" && req.url === "/js/login.js") {
            sendPage(res, path.join("js", "login.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/auth-visitor.js") {
            sendPage(res, path.join("js", "auth-visitor.js"), "application/javascript");
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

        if (req.method === "GET" && req.url === "/api/exhibitions") {
            await listExhibitionHandler(req, res);
            return;
        }

        if (req.method === "GET" && req.url === "/api/curator/collections") {
            if (!requireCurator(req, res)) return;
            await listCollectionsHandler(req, res);
            return;
        }

/*        if (req.method === "GET" && req.url === "/api/collections") {
            await listCollectionsHandler(req, res);
            return;
        }
Duplicate listCollectionsHandler, first one isat line 277*/
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
        
        if (req.method === "GET" && req.url === "/api/director/personnel") {
            if (!requireDirector(req, res)) return;
            await listPersonnelHandler(req, res);
            return;
        }

//        if (req.method === "GET" && req.url === "/js/director-personnel.js") {
//            sendPage(
//                res,
//                path.join("js", "director-personnel.js"),
//                "application/javascript"
//            );
//            return;
//        }


        if (req.method === "GET" && req.url === "/js/director-personnel.js") {
            if (!requireDirector(req, res)) return;
            sendPage(res, path.join("js", "director-personnel.js"), "application/javascript");
            return;
        }

        const pathname = new URL(req.url, "http://localhost").pathname;

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

        if (req.method === "GET" && req.url === "/components/artwork-form.html") {
            if (!requireCurator(req, res)) return;
            sendPage(res, path.join("components", "artwork-form.html"), "text/html");
            return;
        }

        // thinking about changing regex so that curator can be director or nothing
        const artistMatch = pathname.match(/^\/api\/curator\/artists\/(\d+)$/);
        const artworkMatch = pathname.match(/^\/api\/curator\/artwork\/(\d+)$/);
        const collectionMatch = pathname.match(/^\/api\/curator\/collections\/(\d+)$/);
        const exhibitionMatch = pathname.match(/^\/api\/exhibitions\/(\d+)$/);
        
        const artworkMatchVisitor = pathname.match(/^\/api\/artwork-detail\/(\d+)$/);

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

            if (req.method === "GET") {
                await readExhibitionHandler(req, res);
            }
            
            let isDirector = requireDirector(req, res);
            let isCurator = requireCurator(req, res);

            if (req.method === "PUT") {
                if (!(isDirector || isCurator)) return; 
                await updateExhibitionHandler(req, res);
            }
            else if (req.method === "DELETE") {
                if (!isDirector) return;
                await deleteExhibitionHandler(req, res);
            } else return;
            return;
        }

        if (artworkMatchVisitor && req.method === "GET") {
            req.params = { id: artworkMatchVisitor[1] };
            await readArtworkForVisitorHandler(req, res);
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
