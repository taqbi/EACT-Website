let slideIndex = 1;
showSlides(slideIndex);  // For image slides
showVideoSlides(slideIndex);  // For video slides

// Function to show image slides
function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("mySlides");
    let dots = document.getElementsByClassName("dot");
    
    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }
    
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex - 1].style.display = "block";
    dots[slideIndex - 1].className += " active";
}

// Function to show video slides
function showVideoSlides(n) {
    let i;
    let videoSlides = document.getElementsByClassName("videoSlides");
    let videoDots = document.getElementsByClassName("videoDot");
    
    if (n > videoSlides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = videoSlides.length }
    
    for (i = 0; i < videoSlides.length; i++) {
        videoSlides[i].style.display = "none";
    }
    for (i = 0; i < videoDots.length; i++) {
        videoDots[i].className = videoDots[i].className.replace(" active", "");
    }
    videoSlides[slideIndex - 1].style.display = "block";
    videoDots[slideIndex - 1].className += " active";
}

// Next/previous controls for image slides
function plusSlides(n) {
    showSlides(slideIndex += n);
}

// Thumbnail image controls for image slides
function currentSlide(n) {
    showSlides(slideIndex = n);
}

// Next/previous controls for video slides
function plusVideoSlides(n) {
    showVideoSlides(slideIndex += n);
}

// Thumbnail image controls for video slides
function currentVideoSlide(n) {
    showVideoSlides(slideIndex = n);
}
