// Theme Management for Kubernetes Dashboard

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');
    const themeText = themeToggle.querySelector('span');

    // Check for saved theme preference or use preferred color scheme
    const savedTheme = localStorage.getItem('k8s-dashboard-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set initial theme
    if (savedTheme) {
        document.body.className = savedTheme;
        updateToggleUI(savedTheme === 'dark-theme');
    } else {
        // Use system preference as default
        const isDarkMode = prefersDark;
        document.body.className = isDarkMode ? 'dark-theme' : 'light-theme';
        updateToggleUI(isDarkMode);
    }

    // Toggle theme when button is clicked
    themeToggle.addEventListener('click', () => {
        const isDarkMode = document.body.className === 'dark-theme';
        const newTheme = isDarkMode ? 'light-theme' : 'dark-theme';

        // Apply theme
        document.body.className = newTheme;
        localStorage.setItem('k8s-dashboard-theme', newTheme);

        // Update UI
        updateToggleUI(!isDarkMode);

        // Reload charts with new theme colors
        updateChartsTheme();
    });

    function updateToggleUI(isDarkMode) {
        // Update icon
        themeIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';

        // Update text
        themeText.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
    }

    function updateChartsTheme() {
        // Get theme variables
        const isDarkMode = document.body.className === 'dark-theme';
        const textColor = isDarkMode ? '#e2e8f0' : '#2c3e50';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        // Update chart configs if they exist
        if (window.charts) {
            Object.values(window.charts).forEach(chart => {
                if (chart) {
                    // Update text color
                    chart.options.scales.x.ticks.color = textColor;
                    chart.options.scales.y.ticks.color = textColor;
                    chart.options.scales.x.grid.color = gridColor;
                    chart.options.scales.y.grid.color = gridColor;
                    chart.options.plugins.title.color = textColor;
                    chart.options.plugins.legend.labels.color = textColor;

                    // Update and redraw
                    chart.update();
                }
            });
        }

        // Update doughnut charts if they exist
        if (window.podStatusChart) {
            window.podStatusChart.options.plugins.legend.labels.color = textColor;
            window.podStatusChart.update();
        }
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        const userSetTheme = localStorage.getItem('k8s-dashboard-theme');

        // Only auto-switch if user hasn't manually set a theme
        if (!userSetTheme) {
            const newTheme = e.matches ? 'dark-theme' : 'light-theme';
            document.body.className = newTheme;
            updateToggleUI(e.matches);
            updateChartsTheme();
        }
    });
});
