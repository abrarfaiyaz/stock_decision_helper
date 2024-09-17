// script.js

// Your Alpha Vantage API key
//const API_KEY = 'E1ICKSV019F07HFL';
// script.js


document.getElementById('stock-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const ticker = document.getElementById('ticker').value.toUpperCase();
    const year = document.getElementById('year').value;
    const apiKey = 'E1ICKSV019F07HFL'; // Replace with your API key

    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${ticker}&apikey=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data['Monthly Time Series']) {
                const monthlyData = data['Monthly Time Series'];
                const labels = [];
                const prices = [];

                for (const date in monthlyData) {
                    if (date.startsWith(year)) {
                        labels.push(date);
                        prices.push(parseFloat(monthlyData[date]['4. close']));
                    }
                }

                // Sort the data chronologically
                labels.reverse();
                prices.reverse();

                // Prepare the chart
                const ctx = document.getElementById('stock-chart').getContext('2d');

                // Destroy existing chart instance if it exists
                if (window.stockChart) {
                    window.stockChart.destroy();
                }

                window.stockChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: `${ticker} Stock Price in ${year}`,
                            data: prices,
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
            console.error('Error fetching data:', error);
            alert('Failed to fetch data. Please try again later.');
        });
});
