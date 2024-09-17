// script.js

document.getElementById('stock-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const ticker = document.getElementById('ticker').value.toUpperCase().trim();
    const year = document.getElementById('year').value;

    // Calculate the UNIX timestamp for the start and end of the year
    const startTime = Math.floor(new Date(`${year}-01-01T00:00:00Z`).getTime() / 1000);
    const endTime = Math.floor(new Date(`${year}-12-31T23:59:59Z`).getTime() / 1000);

    const url = `https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v3/get-historical-data?symbol=${ticker}&region=US`;
    // Show loading indicator (optional)
    const loadingIndicator = document.getElementById('loading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }

    fetch(url, {
        method: 'GET',
        headers: {
            'x-rapidapi-host': 'apidojo-yahoo-finance-v1.p.rapidapi.com',
            'x-rapidapi-key': 'ad2dfbef68msh869f6addd82bdf4p14a76cjsn1d1687e0ee5f' // Replace with your RapidAPI key
        }
    })
        .then(response => response.json())
        .then(data => {
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }

            if (data.prices && Array.isArray(data.prices)) {
                const labels = [];
                const prices = [];

                data.prices.forEach(item => {
                    if (item.date >= startTime && item.date <= endTime && item.close !== null) {
                        const date = new Date(item.date * 1000);
                        labels.push(date.toISOString().split('T')[0]);
                        prices.push(item.close);
                    }
                });

                if (labels.length === 0) {
                    alert(`No data available for ${ticker} in ${year}.`);
                    return;
                }

                // Prepare the chart
                const ctx = document.getElementById('stock-chart').getContext('2d');

                // Destroy existing chart instance if it exists
                if (window.stockChart) {
                    window.stockChart.destroy();
                }

                window.stockChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels.reverse(),
                        datasets: [{
                            label: `${ticker} Stock Price in ${year}`,
                            data: prices.reverse(),
                            borderColor: 'rgba(75, 192, 192, 1)',
                            fill: false,
                            tension: 0.1
                        }]
                    },
                    options: {
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    unit: 'month',
                                    displayFormats: {
                                        month: 'MMM'
                                    }
                                }
                            },
                            y: {
                                beginAtZero: false
                            }
                        }
                    }
                });
            } else {
                alert('Error fetching data. Please check the ticker symbol and try again.');
            }
        })
        .catch(error => {
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            console.error('Error fetching data:', error);
            alert('Failed to fetch data. Please try again later.');
        });
});
