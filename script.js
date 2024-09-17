// script.js

// Your Alpha Vantage API key
const API_KEY = 'E1ICKSV019F07HFL';

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

        if (data['Time Series (Daily)']) {
            processHistoricalData(data['Time Series (Daily)']);
        } else {
            alert('Error fetching data. Please check the ticker symbol and try again.');
        }
    } catch (error) {
        console.error('Error fetching historical data:', error);
    }
}

function processHistoricalData(timeSeries) {
    const parsedData = [];

    for (const date in timeSeries) {
        const year = new Date(date).getFullYear();
        if (year >= 2010 && year <= 2023) {
            parsedData.push({
                date: date,
                year: year,
                month: new Date(date).getMonth() + 1,
                close: parseFloat(timeSeries[date]['5. adjusted close']),
            });
        }
    }

    // Group data by year and month
    const monthlyData = {};
    parsedData.forEach(entry => {
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

    plotYearlyChart(monthlyAverages);
}

function plotYearlyChart(monthlyAverages) {
    const datasets = [];
    const colors = [
        '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
        '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
        '#008080', '#e6beff', '#9a6324', '#fffac8',
    ];

    let colorIndex = 0;
    for (const year in monthlyAverages) {
        const dataPoints = monthlyAverages[year].sort((a, b) => a.month - b.month);
        const data = dataPoints.map(dp => ({ x: dp.month, y: dp.avgClose }));
        datasets.push({
            label: year,
            data: data,
            borderColor: colors[colorIndex % colors.length],
            fill: false,
        });
        colorIndex++;
    }

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
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                },
            },
        },
    });
}

async function fetchCurrentYearData(ticker) {
    try {
        const currentYear = new Date().getFullYear();
        const startDate = `${currentYear}-01-01`;
        const endDate = new Date().toISOString().split('T')[0];

        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&apikey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data['Time Series (Daily)']) {
            processCurrentYearData(data['Time Series (Daily)'], currentYear);
        } else {
            alert('Error fetching current year data.');
        }
    } catch (error) {
        console.error('Error fetching current year data:', error);
    }
}

function processCurrentYearData(timeSeries, currentYear) {
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

    const sortedData = parsedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    plotCurrentYearChart(sortedData, currentYear);
}

function plotCurrentYearChart(data, currentYear) {
    const ctx = document.getElementById('currentYearChart').getContext('2d');
    if (window.currentYearChart) {
        window.currentYearChart.destroy();
    }
    window.currentYearChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(entry => entry.date),
            datasets: [{
                label: `${currentYear} Closing Prices`,
                data: data.map(entry => entry.close),
                borderColor: '#007bff',
                fill: false,
            }],
        },
        options: {
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
            plugins: {
                legend: {
                    display: false,
                },
            },
        },
    });

    document.getElementById('currentYearTitle').textContent = `${currentYear} Closing Prices`;
}
