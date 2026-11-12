document.addEventListener("DOMContentLoaded", () => {
    const banner = document.getElementById("site-banner");
    const bannerLink = document.getElementById("site-banner-link");
    const bannerTitle = document.getElementById("site-banner-title");
    const bannerText = document.getElementById("site-banner-text");
    const bannerImage = document.getElementById("site-banner-image");

    if (banner && bannerLink && bannerTitle && bannerText && bannerImage) {
        fetch("/api/site-banner")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Unable to load site banner");
                }
                return response.json();
            })
            .then(siteBanner => {
                if (!siteBanner) {
                    return;
                }

                bannerTitle.textContent = siteBanner.BannerTitle || "";
                bannerText.textContent = siteBanner.BannerText || "";
                bannerLink.href = `/exhibition-detail/${encodeURIComponent(siteBanner.ExhibitionID)}`;
                bannerImage.onerror = () => {
                    bannerImage.hidden = true;
                };
                if (siteBanner.RepresentativeArtworkImageURL) {
                    bannerImage.src =
                        siteBanner.RepresentativeArtworkImageURL;
                    bannerImage.alt =
                        `Representative artwork for ${siteBanner.BannerTitle || "featured exhibition"}`;
                    bannerImage.hidden = false;
                } else {
                    bannerImage.removeAttribute("src");
                    bannerImage.alt = "";
                    bannerImage.hidden = true;
                }
                banner.hidden = false;
            })
            .catch(error => console.error("Site banner error:", error));
    }

    const slides = document.querySelectorAll(".slide");

    if (!slides.length) {
        return;
    }

    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach(slide => {
            slide.classList.remove("active");
        });

        slides[index].classList.add("active");
    }

    setInterval(() => {
        currentSlide++;

        if (currentSlide >= slides.length) {
            currentSlide = 0;
        }

        showSlide(currentSlide);
    }, 5000);
});
