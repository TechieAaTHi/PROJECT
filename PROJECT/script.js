document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');
    const searchButton = document.querySelector('.search-section button');
    let debounceTimer;

    // Event listeners for search and filters
    searchButton.addEventListener('click', searchContent);
    searchInput.addEventListener('input', searchContent); // Live search as user types
    genreFilter.addEventListener('change', searchContent); // Trigger filtering on genre change
    yearFilter.addEventListener('change', searchContent);  // Trigger filtering on year change

    populateYearFilter();

    // Populate year filter with a fixed range from 2008 to 2024
    function populateYearFilter() {
        const startYear = 2008;
        const endYear = 2024;

        for (let year = startYear; year <= endYear; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        }
    }

    // Search and filter content
    function searchContent() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const input = searchInput.value.toLowerCase().trim();
            const genre = genreFilter.value.toLowerCase();
            const year = yearFilter.value;
            const movieCards = document.querySelectorAll('.movie-card');

            movieCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const cardGenre = card.getAttribute('data-genre').toLowerCase();
                const cardYear = card.getAttribute('data-year');

                // Check for matching search input, genre, and year
                if (
                    (input === "" || title.includes(input)) &&
                    (genre === "" || cardGenre.includes(genre)) && // Match partial genres
                    (year === "" || cardYear === year)
                ) {
                    card.style.display = 'block'; // Show matching cards
                } else {
                    card.style.display = 'none';   // Hide non-matching cards
                }
            });
        }, 300); // Debounce delay for better performance
    }

    // Function to open the modal with movie information
    function openModal(movie) {
        document.getElementById('modalTitle').innerText = movie.title;
        document.getElementById('modalImage').src = movie.image;
        document.getElementById('modalYear').innerText = Release Year: ${movie.year};
        document.getElementById('modalGenre').innerText = Genre: ${movie.genre};
        document.getElementById('modalRating').innerText = Rating: ${movie.rating};
        document.getElementById('modalPlot').innerText = Plot: ${movie.plot};
        document.getElementById('modalTrailerLink').href = movie.trailer;

        document.getElementById('movieModal').style.display = "block";
    }

    // Function to close the modal
    document.getElementById('closeModal').onclick = function() {
        document.getElementById('movieModal').style.display = "none";
    }

    // Close modal when clicking anywhere outside of the modal content
    window.onclick = function(event) {
        if (event.target == document.getElementById('movieModal')) {
            document.getElementById('movieModal').style.display = "none";
        }
    }

    // Attach click event to each movie card
    document.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', () => {
            const movie = {
                title: card.querySelector('h3').innerText,
                image: card.querySelector('img').src,
                year: card.getAttribute('data-year'),
                genre: card.getAttribute('data-genre'),
                rating: card.querySelector('p:nth-child(4)').innerText.split(": ")[1],
                plot: card.querySelector('p:nth-child(5)').innerText.split(": ")[1],
                trailer: card.querySelector('a').href,
            };
            openModal(movie);
        });
    });

    // Function to submit a comment
    function submitComment() {
        const commentText = document.getElementById('commentText').value;
        const userName = document.getElementById('userName').value || "Anonymous";

        if (commentText.trim() === "") {
            alert("Please write a comment before submitting.");
            return;
        }

        const commentList = document.getElementById('commentList');

        // Create a new comment element
        const commentDiv = document.createElement('div');
        commentDiv.classList.add('comment');
        commentDiv.innerHTML = <strong>${userName}:</strong><p>${commentText}</p>;

        // Add the new comment to the comment list
        commentList.appendChild(commentDiv);

        // Clear the form
        document.getElementById('commentText').value = '';
        document.getElementById('userName').value = '';
    }

    // Attach submitComment to the submit button in the comment form
    document.querySelector('.comment-section button').addEventListener('click', submitComment);
});