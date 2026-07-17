
let selectedFile = null;
let intendedPage = '#home'; // The page user was trying to access before login

// DOM elements
const authModal = document.getElementById('authModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const continueAsGuestBtn = document.getElementById('continueAsGuestBtn');
const continueAsGuestBtn2 = document.getElementById('continueAsGuestBtn2');
const logoutBtn = document.getElementById('logoutBtn');
const loginNavBtn = document.getElementById('loginNavBtn');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('previewImage');
const removeBtn = document.getElementById('removeBtn');
const uploadForm = document.getElementById('uploadForm');
const results = document.getElementById('results');
const reportsList = document.getElementById('reportsList');
const statusFilter = document.getElementById('statusFilter');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoader = submitBtn.querySelector('.btn-loader');
const useLocationBtn = document.getElementById('useLocationBtn');
const locationInput = document.getElementById('location');
const roadTypeInput = document.getElementById('roadType');
const navLinks = document.querySelectorAll('.nav-link');
const heroUploadBtn = document.getElementById('heroUploadBtn');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('user') !== null;
}

// Update UI based on login status
function updateUIBasedOnLogin() {
    if (isLoggedIn()) {
        loginNavBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-flex';
    } else {
        loginNavBtn.style.display = 'inline-flex';
        logoutBtn.style.display = 'none';
    }
}

// Show/hide auth modal
function showAuthModal() {
    authModal.classList.add('active');
}

function hideAuthModal() {
    authModal.classList.remove('active');
}

// Switch between login and signup forms
function showLoginForm() {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginError.style.display = 'none';
    signupError.style.display = 'none';
}

function showSignupForm() {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    loginTab.classList.remove('active');
    signupTab.classList.add('active');
    loginError.style.display = 'none';
    signupError.style.display = 'none';
}

// Check if page is protected
function isProtectedPage(hash) {
    return ['#upload', '#admin'].includes(hash);
}

// Handle navigation
function handleNavigation() {
    const hash = window.location.hash || '#home';

    // Update active nav link
    navLinks.forEach(link => {
        if (link.getAttribute('href') === hash) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Check if protected page
    if (isProtectedPage(hash) && !isLoggedIn()) {
        intendedPage = hash;
        showAuthModal();
        return;
    }

    // Scroll to section
    const section = document.querySelector(hash);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Tab event listeners
loginTab.addEventListener('click', showLoginForm);
signupTab.addEventListener('click', showSignupForm);
closeModalBtn.addEventListener('click', hideAuthModal);
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) hideAuthModal();
});

// Login form handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    
    const formData = new FormData(loginForm);
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('user', JSON.stringify(data));
            updateUIBasedOnLogin();
            hideAuthModal();
            window.location.hash = intendedPage;
            loadReports();
        } else {
            const errorData = await response.json();
            loginError.textContent = errorData.detail || 'Login failed';
            loginError.style.display = 'block';
        }
    } catch (error) {
        console.error(error);
        loginError.textContent = 'An error occurred. Please try again.';
        loginError.style.display = 'block';
    }
});

// Signup form handler
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupError.style.display = 'none';
    
    const formData = new FormData(signupForm);
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            // Auto login after registration
            localStorage.setItem('user', JSON.stringify(data));
            updateUIBasedOnLogin();
            hideAuthModal();
            window.location.hash = intendedPage;
            loadReports();
        } else {
            const errorData = await response.json();
            signupError.textContent = errorData.detail || 'Registration failed';
            signupError.style.display = 'block';
        }
    } catch (error) {
        console.error(error);
        signupError.textContent = 'An error occurred. Please try again.';
        signupError.style.display = 'block';
    }
});

// Continue as guest
continueAsGuestBtn.addEventListener('click', () => {
    intendedPage = '#home';
    window.location.hash = '#home';
    hideAuthModal();
});

continueAsGuestBtn2.addEventListener('click', () => {
    intendedPage = '#home';
    window.location.hash = '#home';
    hideAuthModal();
});

// Login nav button
loginNavBtn.addEventListener('click', () => {
    intendedPage = window.location.hash || '#home';
    showAuthModal();
});

// Logout handler
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('user');
    updateUIBasedOnLogin();
    window.location.hash = '#home';
});

// Hero upload button
heroUploadBtn.addEventListener('click', (e) => {
    if (!isLoggedIn()) {
        e.preventDefault(); // Prevent default anchor behavior only when not logged in
        intendedPage = '#upload';
        showAuthModal();
    }
    // If logged in, let the anchor's default behavior (setting #upload) happen
});

// Window hash change
window.addEventListener('hashchange', handleNavigation);

// Dropzone functionality
dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#ffffff';
});

dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = '#2E2E2E';
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#2E2E2E';
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        dropzone.querySelector('.dropzone-content').style.display = 'none';
        preview.style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

removeBtn.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    preview.style.display = 'none';
    dropzone.querySelector('.dropzone-content').style.display = 'block';
    results.style.display = 'none';
});

// Use current location
useLocationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        useLocationBtn.disabled = true;
        useLocationBtn.textContent = 'Getting location...';
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                locationInput.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                useLocationBtn.disabled = false;
                useLocationBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0 1 18 0Z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Use My Location
                `;
            },
            (error) => {
                alert('Unable to get your location: ' + error.message);
                useLocationBtn.disabled = false;
                useLocationBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0 1 18 0Z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Use My Location
                `;
            }
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
});

// Upload form submission
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) {
        intendedPage = '#upload';
        showAuthModal();
        return;
    }

    if (!selectedFile) {
        alert('Please select an image first');
        return;
    }
    // Show loader
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-flex';
    submitBtn.disabled = true;
    
    const user = JSON.parse(localStorage.getItem('user'));
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('location', locationInput.value);
    formData.append('roadType', roadTypeInput.value);
    if (user && user.user_id) {
        formData.append('user_id', user.user_id);
    }
    
    try {
        const response = await fetch('/api/detect', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        displayResults(data);
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while analyzing the image');
    } finally {
        // Hide loader
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
    }
});

function displayResults(data) {
    results.style.display = 'block';
    const severityColor = data.severity === 'High' ? '#EF4444' : 
                          data.severity === 'Medium' ? '#F59E0B' : 
                          data.severity === 'Low' ? '#10B981' : '#A3A3A3';
    if (data.detections.length === 0) {
        results.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h3 style="margin-top: 1rem;">Road looks healthy</h3>
                <p style="margin-top: 0.5rem; color: #A3A3A3;">No maintenance required.</p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0;">
                <div>
                    <small style="color: #A3A3A3; display: block; margin-bottom: 8px;">Original Image</small>
                    <img src="${data.image_url}" alt="Original image" style="width: 100%; border-radius: 10px; border: 1px solid #2E2E2E;">
                </div>
            </div>
            <p><strong>Road Type:</strong> ${data.road_type}</p>
            <p><strong>Assigned Authority:</strong> ${data.authority}</p>
            <div style="margin-top: 24px;">
                <span class="severity" style="background: ${severityColor}20; border: 1px solid ${severityColor}; color: ${severityColor};">Severity: ${data.severity}</span>
            </div>
            <div style="margin-top: 24px;">
                <button class="btn btn-primary" onclick="generateReport('${data.report_id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Generate Report
                </button>
            </div>
        `;
    } else {
        const detectionsHTML = data.detections.map(d => `
            <div class="detection-item">
                <span>${d.class}</span>
                <span>${(d.confidence * 100).toFixed(1)}%</span>
            </div>
        `).join('');
        results.innerHTML = `
            <h3>Analysis Complete</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0;">
                <div>
                    <small style="color: #A3A3A3; display: block; margin-bottom: 8px;">Original Image</small>
                    <img src="${data.image_url}" alt="Original image" style="width: 100%; border-radius: 10px; border: 1px solid #2E2E2E;">
                </div>
                <div>
                    <small style="color: #A3A3A3; display: block; margin-bottom: 8px;">Detected Damage</small>
                    <img src="${data.annotated_image_url}" alt="Annotated image" style="width: 100%; border-radius: 10px; border: 1px solid #2E2E2E;">
                </div>
            </div>
            <p><strong>Road Type:</strong> ${data.road_type}</p>
            <p><strong>Assigned Authority:</strong> ${data.authority}</p>
            <div class="detections">
                <h4>Detected Damage:</h4>
                ${detectionsHTML}
            </div>
            <div style="margin-top: 24px;">
                <span class="severity" style="background: ${severityColor}20; border: 1px solid ${severityColor}; color: ${severityColor};">Severity: ${data.severity}</span>
            </div>
            <p style="margin-top: 1rem; color: #A3A3A3;">Report has been generated and sent to the relevant authorities.</p>
            <div style="margin-top: 24px;">
                <button class="btn btn-primary" onclick="generateReport('${data.report_id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Generate Report
                </button>
            </div>
        `;
    }
    loadReports();
}

async function generateReport(reportId) {
    try {
        const response = await fetch(`/api/reports/${reportId}/generate`, {
            method: 'POST'
        });
        const data = await response.json();
        if (response.ok) {
            // Show success message
            alert(data.message);
            // Download PDF
            window.open(data.pdf_url, '_blank');
            // Reload reports
            loadReports();
        } else {
            alert('Failed to generate report: ' + (data.detail || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error generating report:', error);
        alert('An error occurred while generating the report');
    }
}

// Load reports
async function loadReports() {
    try {
        const status = statusFilter.value;
        const url = status ? `/api/reports?status=${encodeURIComponent(status)}` : '/api/reports';
        const response = await fetch(url);
        const reports = await response.json();
        displayReports(reports);
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

function displayReports(reports) {
    if (reports.length === 0) {
        reportsList.innerHTML = '<p style="text-align: center; color: #A3A3A3; padding: 3rem;">No reports found.</p>';
        return;
    }
    reportsList.innerHTML = reports.map(report => `
        <div class="report-card">
            <div class="report-header">
                <div>
                    <h3>Report #${report.id}</h3>
                    <small>${new Date(report.created_at).toLocaleString()}</small>
                    ${report.location ? `<p style="margin-top: 8px; color: #A3A3A3;"><strong>Location:</strong> ${report.location}</p>` : ''}
                </div>
                <div class="report-actions">
                    <select class="status-select form-control" data-report-id="${report.id}" onchange="updateStatus(this)">
                        <option value="Pending" ${report.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Submitted" ${report.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
                        <option value="Under Review" ${report.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                        <option value="Repair Scheduled" ${report.status === 'Repair Scheduled' ? 'selected' : ''}>Repair Scheduled</option>
                        <option value="Completed" ${report.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                    <button class="btn btn-danger btn-small" onclick="deleteReport('${report.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
            <p><strong>Road Type:</strong> ${report.road_type || 'N/A'}</p>
            <p><strong>Assigned Authority:</strong> ${report.authority || 'N/A'}</p>
            ${report.damage_types ? `<p><strong>Damage Types:</strong> ${report.damage_types}</p>` : ''}
            <p><strong>Status:</strong> ${report.status}</p>
            <div class="report-images">
                <div>
                    <small>Original Image</small>
                    <img src="${report.image_url}" alt="Original">
                </div>
                ${report.annotated_image_url ? `
                <div>
                    <small>Annotated Image</small>
                    <img src="${report.annotated_image_url}" alt="Annotated">
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Update report status
async function updateStatus(select) {
    const reportId = select.dataset.reportId;
    const status = select.value;
    const formData = new FormData();
    formData.append('status', status);
    try {
        await fetch(`/api/reports/${reportId}/status`, {
            method: 'PUT',
            body: formData
        });
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status');
        loadReports();
    }
}

// Delete report
async function deleteReport(reportId) {
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
        try {
            await fetch(`/api/reports/${reportId}`, {
                method: 'DELETE'
            });
            loadReports();
        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Failed to delete report');
        }
    }
}

statusFilter.addEventListener('change', loadReports);

// Initialization
function init() {
    updateUIBasedOnLogin();
    handleNavigation();
    if (isLoggedIn()) {
        loadReports();
    }
}

init();

