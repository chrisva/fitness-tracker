const palette = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a78bfa', '#45b7d1'];

let stepsChart, activityChart, hrChart;

function buildStatsHTML(today, trends) {
  const t = (key, label, unit = '') => {
    const tr = trends[key];
    const dir = tr.direction === 'up' ? '↑' : '↓';
    const cls = tr.direction === 'up' ? 'up' : 'down';
    const detail = tr.percent != null ? `${tr.percent}% vs yesterday` : `${tr.minutes} min`;
    return `<div class="trend ${cls}">${dir} ${detail}</div>`;
  };

  document.getElementById('stat-steps').textContent = today.steps.toLocaleString();
  document.getElementById('stat-cal').textContent = today.calories.toLocaleString();
  document.getElementById('stat-hr').textContent = `${today.heartRate} bpm`;
  document.getElementById('stat-sleep').textContent = `${today.sleep.hours}h ${today.sleep.minutes}m`;

  document.querySelector('#card-steps .trend').outerHTML = t('steps');
  document.querySelector('#card-cal .trend').outerHTML = t('calories');
  document.querySelector('#card-hr .trend').outerHTML = t('heartRate');
  document.querySelector('#card-sleep .trend').outerHTML = t('sleep');
}

function buildWorkoutList(workouts) {
  const ul = document.getElementById('workout-list');
  ul.innerHTML = workouts.map(w =>
    `<li><span class="emoji">${w.emoji}</span><div class="name">${w.name}<div class="meta">${w.meta}</div></div></li>`
  ).join('');
}

function initCharts(data) {
  const stepsCtx = document.getElementById('stepsChart').getContext('2d');
  const stepsGradient = stepsCtx.createLinearGradient(0, 0, 0, 280);
  stepsGradient.addColorStop(0, 'rgba(255, 107, 107, 0.5)');
  stepsGradient.addColorStop(1, 'rgba(255, 107, 107, 0.02)');

  stepsChart = new Chart(stepsCtx, {
    type: 'line',
    data: {
      labels: data.week.labels,
      datasets: [{
        label: 'Steps',
        data: data.week.steps,
        borderColor: '#ff6b6b',
        backgroundColor: stepsGradient,
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ff6b6b',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } }
      }
    }
  });

  activityChart = new Chart(document.getElementById('activityChart'), {
    type: 'doughnut',
    data: {
      labels: data.activityBreakdown.labels,
      datasets: [{
        data: data.activityBreakdown.data,
        backgroundColor: palette,
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true } }
      }
    }
  });

  hrChart = new Chart(document.getElementById('hrChart'), {
    data: {
      labels: data.week.labels,
      datasets: [
        {
          type: 'bar',
          label: 'Calories',
          data: data.week.calories,
          backgroundColor: 'rgba(78, 205, 196, 0.7)',
          borderRadius: 8,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Heart Rate (bpm)',
          data: data.week.heartRate,
          borderColor: '#a78bfa',
          backgroundColor: '#a78bfa',
          borderWidth: 3,
          tension: 0.4,
          yAxisID: 'y1',
          pointRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
      scales: {
        y: { position: 'left', beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
        y1: { position: 'right', beginAtZero: false, grid: { display: false } },
        x: { grid: { display: false } }
      }
    }
  });
}

function initRangeSwitcher(data) {
  document.querySelectorAll('.controls button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const range = data[btn.dataset.range];
      stepsChart.data.labels = range.labels;
      stepsChart.data.datasets[0].data = range.steps;
      stepsChart.update();
      hrChart.data.labels = range.labels;
      hrChart.data.datasets[0].data = range.calories;
      hrChart.data.datasets[1].data = range.heartRate;
      hrChart.update();
    });
  });
}

function setGreeting() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = `${greeting}! Let's crush today's goals.`;
}

fetch('data/fitness.json')
  .then(r => r.json())
  .then(data => {
    setGreeting();
    buildWorkoutList(data.recentWorkouts);
    initCharts(data);
    initRangeSwitcher(data);

    if (data.today._updated) {
      const t = new Date(data.today._updated);
      document.getElementById('last-updated').textContent =
        `Updated ${t.toLocaleString()}`;
    }
  })
  .catch(() => console.error('Could not load fitness.json'));
