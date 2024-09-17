// script.js

// Your Finnhub API key
const API_KEY = 'crkrbnhr01qhc7mj8etgcrkrbnhr01qhc7mj8eu0'; // Replace with your actual API key

document.getElementById('fetchData').addEventListener('click', () => {
    const ticker = document.getElementById('ticker').value.trim().toUpperCase();
    if (ticker) {
        fetchHistoricalData(ticker);
        fetchCurrentYearData(ticker);
    } else {
        alert('Please enter a valid ticker symbol.');
    }
});

// Convert date to Unix timestamp
function dateToTimestamp(dateStr) {
    return Math.floor(new Date(dateStr).getTime() / 1000);
}

async function fetchHistoricalData(ticker) {
    try {
        const startDate = dateToTimestamp('2010-01-01');
        const endDate = dateToTimestamp('2023-12-31');
        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=D&from=${startDate}&to=${endDate}&token=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        console.log('Historical Data API Response:', data); // For debugging

        if (data.s === 'ok') {
            processHistoricalData(data, ticker);
        } else if (data.s === 'no_data') {
            alert(`No historical data available for ticker ${ticker}.`);
        } else {
            alert('Error fetching data. Please check the ticker symbol and try again.');
        }
    } catch (error) {
        console.error('Error fetching historical data:', error);
        alert('An error occurred while fetching historical data.');
    }
}

function processHistoricalData(data, ticker) {
    const parsedData = [];

    for (let i = 0; i < data.t.length; i++) {
        const timestamp = data.t[i];
        const date = new Date(timestamp * 1000);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const close = data.c[i];

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
        const startDate = dateToTimestamp(`${currentYear}-01-01`);
        const endDate = Math.floor(Date.now() / 1000);
        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=D&from=${startDate}&to=${endDate}&token=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        console.log('Current Year Data API Response:', data); // For debugging

        if (data.s === 'ok') {
            processCurrentYearData(data, currentYear, ticker);
        } else if (data.s === 'no_data') {
            alert(`No data available for the current year for ticker ${ticker}.`);
        } else {
            alert('Error fetching current year data.');
        }
    } catch (error) {
        console.error('Error fetching current year data:', error);
        alert('An error occurred while fetching current year data.');
    }
}

function processCurrentYearData(data, currentYear, ticker) {
    const parsedData = [];

    for (let i = 0; i < data.t.length; i++) {
        const timestamp = data.t[i];
        const date = new Date(timestamp * 1000);
        const close = data.c[i];

        parsedData.push({
            date: date.toISOString().split('T')[0],
            close: close,
        });
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
