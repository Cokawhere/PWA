document.addEventListener('DOMContentLoaded', () => {
    const postSelect = document.getElementById('postSelect');
    const postDescription = document.getElementById('postDescription');
    const connectionStatus = document.getElementById('connectionStatus');

    function updateConnectionStatus() {
        if (navigator.onLine) {
            connectionStatus.style.display = 'none';
        } else {
            connectionStatus.style.display = 'block';
        }
    }

    updateConnectionStatus();

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);

    fetchPosts();

    async function fetchPosts() {
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const posts = await response.json();
            
            posts.forEach(post => {
                const option = document.createElement('option');
                option.value = post.id;
                option.textContent = post.title;
                postSelect.appendChild(option);
            });

            caches.open('maybelline-cache-v1').then(cache => {
                cache.put('https://jsonplaceholder.typicode.com/posts', 
                    new Response(JSON.stringify(posts), {
                        headers: { 'Content-Type': 'application/json' }
                    })
                );
            });
        } catch (error) {
            caches.match('https://jsonplaceholder.typicode.com/posts')
                .then(response => {
                    if (response) {
                        return response.json();
                    }
                    throw new Error('No cached data available');
                })
                .then(posts => {
                    posts.forEach(post => {
                        const option = document.createElement('option');
                        option.value = post.id;
                        option.textContent = post.title;
                        postSelect.appendChild(option);
                    });
                })
                .catch(() => {
                    postDescription.innerHTML = '<p class="error-message">Oops! Couldn\'t load posts. Please check your connection and try again. 💄</p>';
                });
        }
    }

    postSelect.addEventListener('change', async (event) => {
        const postId = event.target.value;
        if (!postId) {
            postDescription.innerHTML = '';
            return;
        }

        try {
            const cachedResponse = await caches.match('https://jsonplaceholder.typicode.com/posts');
            let post;
            
            if (cachedResponse) {
                const posts = await cachedResponse.json();
                post = posts.find(p => p.id == postId);
            } else {
                const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                post = await response.json();
            }

            postDescription.innerHTML = `
                <h3>${post.title}</h3>
                <p>${post.body}</p>
            `;
        } catch (error) {
            postDescription.innerHTML = '<p class="error-message">Couldn\'t load post details. Please try again later. 💄</p>';
        }
    });
});