var ctx1 = document.getElementById('idChart1').getContext('2d');
var ctx2 = document.getElementById('idChart2').getContext('2d');
var ctx3 = document.getElementById('idChart3').getContext('2d');

const data1 = {
  labels: ['18:00', '18:03', '18:06', '18:09', '18:12', '18:15', '18:18', '18:21', '18:24', '18:27'],
  datasets: [{
    label: 'CPU',
    data: [65, 59, 80, 81, 56, 55, 40, 50, 65, 70],
    fill: false,
    borderColor: 'rgb(75, 192, 192)',
    tension: 0.1
  }]
};

const data2 = {
    labels: ['18:00', '18:03', '18:06', '18:09', '18:12', '18:15', '18:18', '18:21', '18:24', '18:27'],
    datasets: [{
      label: 'Memória',
      data: [3, 3.5, 3.5, 3.6, 3.7, 3.7, 4.5, 3, 4.5, 3],
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

const data3 = {
labels: ['18:00', '18:03', '18:06', '18:09', '18:12', '18:15', '18:18', '18:21', '18:24', '18:27'],
datasets: [{
    label: 'Disco',
    data: [350, 351, 351, 351, 348, 348, 348, 348, 350, 348],
    fill: false,
    borderColor: 'rgb(75, 192, 192)',
    tension: 0.1
}]
};

const config1 = {
    type: 'line',
    data: data1,
};

const config2 = {
    type: 'line',
    data: data2,
};

const config3 = {
    type: 'line',
    data: data3,
};

var myChart1 = new Chart(ctx1, config1);
var myChart2 = new Chart(ctx2, config2);
var myChart3 = new Chart(ctx3, config3);