let availableMetrics = [];
let chartInstances = [];

function visualizeData() {
    const selectedMetrics = Array.from(document.querySelectorAll('#metricCheckboxes input:checked')).map(checkbox => checkbox.value);
    const errorMessageElement = document.getElementById('errorMessage');
    errorMessageElement.textContent = '';

    if (selectedMetrics.length === 0) {
        errorMessageElement.textContent = 'Please select at least one metric to visualize.';
        return;
    }

    try {
        const data = document.getElementById('dataInput').value;
        processData(data, selectedMetrics);
    } catch (error) {
        console.error("Error in visualizeData:", error);
        errorMessageElement.textContent = error.message;
    }
}

function processData(data, metricsToVisualize) {
    try {
        const rows = data.split('\n')
            .map(row => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.trim().replace(/^"(.*)"$/, '$1')))
            .filter(row => row.length > 1);

        if (rows.length < 2) {
            throw new Error('Not enough data to process. Please check your input.');
        }

        const headers = rows[0].map(header => header.toLowerCase());
        const dateIndex = headers.indexOf('date');
        const metricIndex = headers.indexOf('metric');
        const valueIndex = headers.indexOf('value');

        if (dateIndex === -1 || metricIndex === -1 || valueIndex === -1) {
            throw new Error('Invalid data format. Please ensure your data has Date, Metric, and Value columns.');
        }

        const filteredData = {};
        metricsToVisualize.forEach(metric => {
            filteredData[metric] = rows.slice(1).filter(row => {
                if (row.length <= Math.max(dateIndex, metricIndex, valueIndex)) {
                    return false;
                }
                const value = parseFloat(row[valueIndex].replace(/,/g, ''));
                return row[metricIndex].toLowerCase() === metric.toLowerCase() && !isNaN(value) && value > 0;
            });

            if (filteredData[metric].length === 0) {
                throw new Error(`No valid data found for the metric: ${metric}`);
            }
        });

        const uniqueDates = [...new Set(Object.values(filteredData).flat().map(row => row[dateIndex]))].sort();
        
        const datasets = [];
        metricsToVisualize.forEach((metric, index) => {
            const datasetValues = uniqueDates.map(date => {
                const matchingRow = filteredData[metric].find(row => row[dateIndex] === date);
                return matchingRow ? parseFloat(matchingRow[valueIndex].replace(/,/g, '')) : null;
            });
            datasets.push({
                label: metric,
                data: datasetValues,
                backgroundColor: getChartColors(metricsToVisualize.length, index),
                borderColor: getChartColors(metricsToVisualize.length, index)
            });
        });

        createCharts(uniqueDates, datasets);
    } catch (error) {
        console.error("Error in processData:", error);
        document.getElementById('errorMessage').textContent = error.message;
    }
}

function updateMetricCheckboxes(data) {
    try {
        const rows = data.split('\n')
            .map(row => row.split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1')))
            .filter(row => row.length > 1 && row.some(cell => cell !== ''));

        if (rows.length < 2) {
            throw new Error('Not enough data to process. Please check your input.');
        }

        const headers = rows[0].map(header => header.toLowerCase());
        const metricIndex = headers.indexOf('metric');

        if (metricIndex === -1) {
            throw new Error('Invalid data format. Please ensure your data has a Metric column.');
        }

        availableMetrics = [...new Set(rows.slice(1).map(row => row[metricIndex]).filter(Boolean))];

        const metricCheckboxes = document.getElementById('metricCheckboxes');
        metricCheckboxes.innerHTML = '';
        availableMetrics.forEach(metric => {
            const checkboxWrapper = document.createElement('div');
            checkboxWrapper.className = 'metric-checkbox';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `metric-${metric}`;
            checkbox.value = metric;
            const label = document.createElement('label');
            label.htmlFor = `metric-${metric}`;
            label.textContent = metric;
            checkboxWrapper.appendChild(checkbox);
            checkboxWrapper.appendChild(label);
            metricCheckboxes.appendChild(checkboxWrapper);
        });
    } catch (error) {
        console.error("Error updating metric checkboxes:", error);
        document.getElementById('errorMessage').textContent = error.message;
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toFixed(0);
}

function getChartColors(totalMetrics, metricIndex) {
    const baseColors = [
        '#d70022', '#726f6f', '#000000', '#02bd9c', '#0060df',
        '#45a1ff', '#ff9400', '#b5007f', '#30e60b', '#ffcb00'
    ];

    if (totalMetrics === 1) {
        return [baseColors[0], baseColors[1]];
    } else {
        return baseColors[metricIndex % baseColors.length];
    }
}

function createCharts(labels, datasets) {
    const chartTypes = [
        { type: 'bar', title: 'Bar Chart' },
        { type: 'bar', title: 'Horizontal Bar Graph', horizontal: true },
        { type: 'line', title: 'Line Graph' },
        { type: 'bar', title: 'Column + Line Graph', lineDataset: true },
        { type: 'pie', title: 'Pie Chart' },
        { type: 'line', title: 'Area Chart', fill: true }
    ];
    const chartContainer = document.getElementById('chartContainer');
    chartContainer.innerHTML = '';
    chartInstances = [];

    chartTypes.forEach(chartInfo => {
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-wrapper';
        wrapper.style.height = '500px';
        wrapper.style.marginBottom = '60px';
        wrapper.style.position = 'relative';

        const title = document.createElement('h2');
        title.textContent = chartInfo.title;
        title.style.marginBottom = '20px';
        title.style.fontSize = '24px';
        title.style.textAlign = 'center';
        title.contentEditable = "true";
        wrapper.appendChild(title);

        const canvas = document.createElement('canvas');
        wrapper.appendChild(canvas);

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
        downloadBtn.onclick = () => downloadChart(canvas, title.textContent);
        wrapper.appendChild(downloadBtn);

        chartContainer.appendChild(wrapper);

        try {
            let chartDatasets = datasets;
            if (chartInfo.type === 'pie') {
                chartDatasets = [{
                    data: datasets[0].data,
                    backgroundColor: datasets[0].backgroundColor,
                    borderColor: datasets[0].borderColor,
                    label: datasets[0].label
                }];
            }

            const data = {
                labels: labels,
                datasets: chartDatasets.map(dataset => ({
                    ...dataset,
                    borderWidth: 1,
                    fill: chartInfo.fill ? 'origin' : false,
                    pointRadius: chartInfo.type === 'line' ? 5 : 0,
                    pointHoverRadius: chartInfo.type === 'line' ? 8 : 0
                }))
            };

            if (chartInfo.lineDataset) {
                data.datasets = data.datasets.map(d => ({ ...d, type: 'bar' }));
                data.datasets.push({
                    type: 'line',
                    label: 'Trend',
                    data: datasets[0].data,
                    borderColor: '#000000',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 5,
                    pointHoverRadius: 8
                });
            }

            const chartInstance = new Chart(canvas, {
                type: chartInfo.type,
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: chartInfo.horizontal ? 'y' : 'x',
                    plugins: {
                        title: { 
                            display: false
                        },
                        legend: {
                            display: datasets.length > 1 || chartInfo.type === 'pie',
                            position: 'bottom',
                            labels: { 
                                font: { family: 'Roboto', weight: 'bold', size: 12 },
                                boxWidth: 15,
                                padding: 15,
                                generateLabels: function(chart) {
                                    const datasets = chart.data.datasets;
                                    return datasets.map((dataset, i) => ({
                                        text: dataset.label,
                                        fillStyle: Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor,
                                        hidden: false,
                                        lineCap: 'butt',
                                        lineDash: [],
                                        lineDashOffset: 0,
                                        lineJoin: 'miter',
                                        lineWidth: 1,
                                        strokeStyle: Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor,
                                        pointStyle: 'circle',
                                        rotation: 0
                                    }));
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += context.parsed.y.toLocaleString();
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: chartInfo.type !== 'pie',
                            ticks: { 
                                font: { family: 'Roboto', weight: 'bold' },
                                maxRotation: 45,
                                minRotation: 45
                            }
                        },
                        y: {
                            display: chartInfo.type !== 'pie',
                            ticks: { 
                                font: { family: 'Roboto', weight: 'bold' },
                                callback: function(value, index, values) {
                                    return formatNumber(value);
                                }
                            },
                            beginAtZero: true
                        }
                    },
                    layout: {
                        padding: {
                            left: 15,
                            right: 25,
                            top: 15,
                            bottom: 15
                        }
                    },
                    onClick: function(event, elements) {
                        if (elements.length > 0) {
                            const element = elements[0];
                            const datasetIndex = element.datasetIndex;
                            const index = element.index;
                            
                            const input = document.createElement('input');
                            input.type = 'text';
                            input.value = chartInstance.data.datasets[datasetIndex].data[index];
                            input.style.position = 'absolute';
                            input.style.left = element.element.x + 'px';
                            input.style.top = element.element.y + 'px';
                            input.style.width = '50px';
                            input.style.zIndex = 1000;
                            
                            chartInstance.canvas.parentNode.appendChild(input);
                            input.focus();
                            
                            input.onblur = function() {
                                const newValue = parseFloat(this.value);
                                if (!isNaN(newValue)) {
                                    chartInstance.data.datasets[datasetIndex].data[index] = newValue;
                                    chartInstance.update();
                                }
                                this.remove();
                            };
                        }
                    }
                },
                plugins: [{
                    beforeInit: function(chart) {
                        const ctx = chart.canvas.getContext('2d');
                        chart.data.datasets.forEach((dataset, i) => {
                            if (chartInfo.type === 'line' && chartInfo.fill && Array.isArray(dataset.backgroundColor)) {
                                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                                gradient.addColorStop(0, dataset.backgroundColor[0]);
                                gradient.addColorStop(1, dataset.backgroundColor[1]);
                                dataset.backgroundColor = gradient;
                            }
                        });
                    },
                    afterDraw: function(chart) {
                        if (chart.config.type === 'pie') {
                            var ctx = chart.ctx;
                            chart.data.datasets.forEach(function(dataset, i) {
                                var meta = chart.getDatasetMeta(i);
                                if (!meta.hidden) {
                                    meta.data.forEach(function(element, index) {
                                        var dataValue = dataset.data[index];
                                        var total = dataset.data.reduce((a, b) => a + b, 0);
                                        var percentage = ((dataValue / total) * 100).toFixed(1) + '%';
                                        var label = (chart.data.labels[index] || '') + ': ' + formatNumber(dataValue);
                                        
                                        var fontSize = 12;
                                        var fontStyle = 'bold';
                                        var fontFamily = 'Roboto';
                                        ctx.font = Chart.helpers.fontString(fontSize, fontStyle, fontFamily);
                                        
                                        var angle = element.startAngle + ((element.endAngle - element.startAngle) / 2);
                                        var x = element.x + Math.cos(angle) * (element.outerRadius * 0.7);
                                        var y = element.y + Math.sin(angle) * (element.outerRadius * 0.7);
                                        
                                        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                                        var labelWidth = ctx.measureText(label).width;
                                        ctx.fillRect(x - labelWidth / 2 - 5, y - fontSize / 2 - 5, labelWidth + 10, fontSize + 10);
                                        
                                        ctx.fillStyle = 'white';
                                        ctx.textAlign = 'center';
                                        ctx.textBaseline = 'middle';
                                        ctx.fillText(label, x, y);
                                        
                                        ctx.font = Chart.helpers.fontString(fontSize * 0.8, 'normal', fontFamily);
                                        ctx.fillText(percentage, x, y + fontSize);
                                    });
                                }
                            });
                        } else {
                            var ctx = chart.ctx;
                            chart.data.datasets.forEach(function(dataset, i) {
                                var meta = chart.getDatasetMeta(i);
                                if (!meta.hidden) {
                                    meta.data.forEach(function(element, index) {
                                        var dataValue = dataset.data[index];
                                        if (dataValue !== null && dataValue !== 0) {
                                            ctx.fillStyle = 'white';
                                            var fontSize = 12;
                                            var fontStyle = 'bold';
                                            var fontFamily = 'Roboto';
                                            ctx.font = Chart.helpers.fontString(fontSize, fontStyle, fontFamily);

                                            var dataString = formatNumber(dataValue);

                                            ctx.textAlign = 'center';
                                            ctx.textBaseline = 'middle';

                                            var padding = 5;
                                            var position = element.tooltipPosition();

                                            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                                            var textWidth = ctx.measureText(dataString).width;
                                            ctx.fillRect(position.x - textWidth/2 - padding, 
                                                         position.y - fontSize/2 - padding, 
                                                         textWidth + padding*2, 
                                                         fontSize + padding*2);

                                            ctx.strokeStyle = 'white';
                                            ctx.lineWidth = 1;
                                            ctx.strokeRect(position.x - textWidth/2 - padding, 
                                                           position.y - fontSize/2 - padding, 
                                                           textWidth + padding*2, 
                                                           fontSize + padding*2);

                                            ctx.fillStyle = 'white';
                                            ctx.fillText(dataString, position.x, position.y);
                                        }
                                    });
                                }
                            });
                        }
                    }
                }]
            });

            chartInstances.push({
                instance: chartInstance,
                type: chartInfo.type
            });

            canvas.addEventListener('dblclick', function(event) {
                const activePoints = chartInstance.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
                if (activePoints.length > 0) {
                    const firstPoint = activePoints[0];
                    const datasetIndex = firstPoint.datasetIndex;
                    const index = firstPoint.index;
                    
                    const existingInput = canvas.parentNode.querySelector('input');
                    if (existingInput) {
                        existingInput.remove();
                    }
                    
                    const currentValue = chartInstance.data.datasets[datasetIndex].data[index];
                    const newValue = prompt('Enter new value:', currentValue);
                    if (newValue !== null && !isNaN(parseFloat(newValue))) {
                        chartInstance.data.datasets[datasetIndex].data[index] = parseFloat(newValue);
                    }
                    
                    if (chartInstance.data.labels[index]) {
                        const currentLabel = chartInstance.data.labels[index];
                        const newLabel = prompt('Enter new label (leave empty to remove):', currentLabel);
                        if (newLabel !== null) {
                            chartInstance.data.labels[index] = newLabel.trim();
                        }
                    }
                    
                    if (chartInfo.type === 'pie') {
                        const total = chartInstance.data.datasets[datasetIndex].data.reduce((a, b) => a + b, 0);
                        const currentPercentage = ((currentValue / total) * 100).toFixed(1);
                        const newPercentage = prompt('Enter new percentage:', currentPercentage);
                        if (newPercentage !== null && !isNaN(parseFloat(newPercentage))) {
                            const newValue = (parseFloat(newPercentage) / 100) * total;
                            chartInstance.data.datasets[datasetIndex].data[index] = newValue;
                        }
                    }
                    
                    chartInstance.update();
                }
            });

            canvas.addEventListener('click', function(event) {
                const legendItem = chartInstance.legend.getElementsAtEventForMode(event, 'point', { intersect: true }, false)[0];
                if (legendItem) {
                    const index = legendItem.index;
                    const currentLabel = chartInstance.data.datasets[index].label;
                    const newLabel = prompt('Enter new legend label:', currentLabel);
                    if (newLabel !== null) {
                        chartInstance.data.datasets[index].label = newLabel.trim();
                        chartInstance.update();
                    }
                }
            });

        } catch (error) {
            console.error(`Error creating ${chartInfo.type} chart:`, error);
            wrapper.innerHTML += `<p style="color: red;">Error creating chart: ${error.message}</p>`;
        }
    });
}

function downloadChart(canvas, title) {
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height + 40;
    
    ctx.drawImage(canvas, 0, 40, canvas.width, canvas.height);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(title, tempCanvas.width / 2, 30);

    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '_')}.png`;
    link.href = tempCanvas.toDataURL();
    link.click();
}

function addInfoIconAndDownloadIcon() {
    const container = document.querySelector('.container');
    const title = document.querySelector('h1');
    
    const iconContainer = document.createElement('div');
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'flex-end';
    iconContainer.style.marginBottom = '10px';

    const infoIcon = document.createElement('i');
    infoIcon.className = 'fas fa-info-circle';
    infoIcon.style.marginRight = '10px';
    infoIcon.style.cursor = 'pointer';
    infoIcon.setAttribute('title', 'Please ensure your data includes the titles Date, Metric and Value');
    iconContainer.appendChild(infoIcon);

    const downloadIcon = document.createElement('i');
    downloadIcon.className = 'fas fa-download';
    downloadIcon.style.cursor = 'pointer';
    downloadIcon.setAttribute('title', 'Download example file');
    downloadIcon.onclick = function() {
        const exampleData = 'Date,Metric,Value\n2023,Website Views,300000\n2024,Website Views,425000';
        const blob = new Blob([exampleData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, 'example_data.csv');
        } else {
            link.href = URL.createObjectURL(blob);
            link.download = 'example_data.csv';
            link.click();
        }
    };
    iconContainer.appendChild(downloadIcon);

    container.insertBefore(iconContainer, title);
}

document.addEventListener('DOMContentLoaded', function() {
    addInfoIconAndDownloadIcon();

    document.getElementById('fileInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                let workbook;
                try {
                    workbook = XLSX.read(data, {type: 'array'});
                } catch (error) {
                    console.error("Error reading file:", error);
                    alert('Error reading file. Please make sure it\'s a valid Excel or CSV file.');
                    return;
                }

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                const csv = XLSX.utils.sheet_to_csv(worksheet);
                
                document.getElementById('dataInput').value = csv;
                
                updateMetricCheckboxes(csv);
            };
            reader.onerror = function(error) {
                console.error("File reading error:", error);
                alert('Error reading file. Please try again.');
            };
            reader.readAsArrayBuffer(file);
        }
    });

    document.getElementById('dataInput').addEventListener('input', function(event) {
        updateMetricCheckboxes(event.target.value);
    });

    document.getElementById('visualizeButton').addEventListener('click', visualizeData);
});