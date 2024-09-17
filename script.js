// script.js

// Your Alpha Vantage API key
const API_KEY = 'E1ICKSV019F07HFL';
// script.js
document.getElementById('fetchData').addEventListener('click', () => {
    const ticker = document.getElementById('ticker').value.trim().toUpperCase();
    if (ticker) {
        fetchHistoricalData(ticker);
        fetchCurrentYearData(ticker);
    } else {
        alert('Please enter a valid ticker symbol.');
    }
});

async function fetchHistoricalData(ticker) {
    try {
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&outputsize=full&apikey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        console.log('Historical Data API Response:', data); // For debugging

        if (data['Time Series (Daily)']) {
            processHistoricalData(data['Time Series (Daily)'], ticker);
        } else if (data['Error Message']) {
            alert(`Error fetching data: ${data['Error Message']}`);
        } else if (data['Note']) {
            alert(`API limit reached: ${data['Note']}`);
        } else {
            alert('Unknown error occurred. Please try again later.');
        }
    } catch (error) {
        console.error('Error fetching historical data:', error);
        alert('An error occurred while fetching historical data.');
    }
}

function processHistoricalData(timeSeries, ticker) {
    const parsedData = [];

    for (const date in timeSeries) {
        const year = new Date(date).getFullYear();
        const month = new Date(date).getMonth() + 1;
        const close = parseFloat(timeSeries[date]['5. adjusted close']);

        parsedData.push({
            date: date,
            year: year,
            month: month,
            close: close,
        });
    }

    // Filter data for years from 2010 to 2023
    const filteredData = parsedData.filter(entry => entry.year >= 2010 && entry.year <= 2023);

    if (filteredData.length === 0) {
        alert(`No historical data available from 2010 for ticker ${ticker}.`);
        // Clear the chart if necessary
        if (window.yearlyChart) {
            window.yearlyChart.destroy();
        }
        return;
    }

    // Group data by year and month
    const monthlyData = {};
    filteredData.forEach(entry => {
        const key = `${entry.year}-${entry.month}`;
        if (!monthlyData[key]) {
            monthlyData[key] = [];
        }
        monthlyData[key].push(entry.close);
    });

    // Calculate monthly averages
    const monthlyAverages = {};
    for (const key in monthlyData) {
        const [year, month] = key.split('-');
        const avgClose = monthlyData[key].reduce((a, b) => a + b, 0) / monthlyData[key].length;
        if (!monthlyAverages[year]) {
            monthlyAverages[year] = [];
        }
        monthlyAverages[year].push({ month: parseInt(month), avgClose: avgClose });
    }

    plotYearlyChart(monthlyAverages, ticker);
}

function plotYearlyChart(monthlyAverages, ticker) {
    const datasets = [];
    const colors = [
        '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
        '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
        '#008080', '#e6beff', '#9a6324', '#fffac8',
    ];

    let colorIndex = 0;
    const years = Object.keys(monthlyAverages).sort();
    years.forEach(year => {
        const dataPoints = monthlyAverages[year].sort((a, b) => a.month - b.month);
        const data = dataPoints.map(dp => ({ x: dp.month, y: dp.avgClose }));
        datasets.push({
            label: year,
            data: data,
            borderColor: colors[colorIndex % colors.length],
            fill: false,
        });
        colorIndex++;
    });

    const ctx = document.getElementById('yearlyChart').getContext('2d');
    if (window.yearlyChart) {
        window.yearlyChart.destroy();
    }
    window.yearlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets,
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: `Yearly Average Closing Prices (${years[0]}-${years[years.length -1]}) for ${ticker}`,
                },
                legend: {
                    display: true,
                    position: 'right',
                },
            },
            scales: {
                x: {
                    type: 'linear',
                    ticks: {
                        callback: function(value) {
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            return months[value - 1];
                        },
                        stepSize: 1,
                        min: 1,
                        max: 12,
                    },
                    title: {
                        display: true,
                        text: 'Month',
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Average Closing Price',
                    },
                },
            },
        },
    });
}

async function fetchCurrentYearData(ticker) {
    try {
        const currentYear = new Date().getFullYear();
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&apikey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        console.log('Current Year Data API Response:', data); // For debugging

        if (data['Time Series (Daily)']) {
            processCurrentYearData(data['Time Series (Daily)'], currentYear, ticker);
        } else if (data['Error Message']) {
            alert(`Error fetching data: ${data['Error Message']}`);
        } else if (data['Note']) {
            alert(`API limit reached: ${data['Note']}`);
        } else {
            alert('Unknown error occurred. Please try again later.');
        }
    } catch (error) {
        console.error('Error fetching current year data:', error);
        alert('An error occurred while fetching current year data.');
    }
}

function processCurrentYearData(timeSeries, currentYear, ticker) {
    const parsedData = [];

    for (const date in timeSeries) {
        const year = new Date(date).getFullYear();
        if (year === currentYear) {
            parsedData.push({
                date: date,
                close: parseFloat(timeSeries[date]['5. adjusted close']),
            });
        }
    }

    if (parsedData.length === 0) {
        alert(`No data available for the current year for ticker ${ticker}.`);
        // Clear the chart if necessary
        if (window.currentYearChart) {
            window.currentYearChart.destroy();
        }
        return;
    }

    const sortedData = parsedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    plotCurrentYearChart(sortedData, currentYear, ticker);
}

function plotCurrentYearChart(data, currentYear, ticker) {
    const ctx = document.getElementById('currentYearChart').getContext('2d');
    if (window.currentYearChart) {
        window.currentYearChart.destroy();
    }
    window.currentYearChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(entry => entry.date),
            datasets: [{
                label: `${currentYear} Closing Prices for ${ticker}`,
                data: data.map(entry => entry.close),
                borderColor: '#007bff',
                fill: false,
            }],
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: `${currentYear} Closing Prices for ${ticker}`,
                },
                legend: {
                    display: false,
                },
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        tooltipFormat: 'MMM DD',
                        displayFormats: {
                            month: 'MMM',
                        },
                    },
                    title: {
                        display: true,
                        text: 'Date',
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Closing Price',
                    },
                },
            },
        },
    });

    document.getElementById('currentYearTitle').textContent = `${currentYear} Closing Prices for ${ticker}`;
}
