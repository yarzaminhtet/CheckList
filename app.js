// Data structure for tasks
let tasks = [];
let taskHistory = [];
let currentPage = 1;
const itemsPerPage = 15;
let selectedTitleId = null;
let lastResetDate = null;

// DOM elements
const newTitleInput = document.getElementById('new-title');
const addTitleBtn = document.getElementById('add-title-btn');
const taskContainer = document.getElementById('task-container');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const currentDateDisplay = document.getElementById('current-date');
const historyContainer = document.getElementById('history-container');

// Format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date for display (e.g., Monday, May 5, 2025)
function formatDisplayDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

// Update current date display
function updateCurrentDateDisplay() {
    const today = new Date();
    currentDateDisplay.textContent = formatDisplayDate(today);
}

// Load tasks from localStorage
function loadTasks() {
    const savedTasks = localStorage.getItem('hierarchicalTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    
    const savedHistory = localStorage.getItem('taskHistory');
    if (savedHistory) {
        taskHistory = JSON.parse(savedHistory);
    }
    
    const savedResetDate = localStorage.getItem('lastResetDate');
    if (savedResetDate) {
        lastResetDate = savedResetDate;
    }
    
    // Check if we need to reset checklists
    checkAndResetChecklists();
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('hierarchicalTasks', JSON.stringify(tasks));
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('taskHistory', JSON.stringify(taskHistory));
}

// Save last reset date to localStorage
function saveLastResetDate(date) {
    lastResetDate = date;
    localStorage.setItem('lastResetDate', lastResetDate);
}

// Check if checklists need to be reset (at midnight)
function checkAndResetChecklists() {
    const today = formatDate(new Date());
    
    // If it's a new day or first time running the app
    if (!lastResetDate || lastResetDate !== today) {
        // Record yesterday's completion status before resetting
        if (lastResetDate) {
            recordDailyCompletion();
        }
        
        // Reset all checklists
        resetAllChecklists();
        
        // Update last reset date
        saveLastResetDate(today);
        
        // Show reset notice
        showResetNotice();
    }
}

// Reset all checklists
function resetAllChecklists() {
    tasks.forEach(title => {
        title.subtitles.forEach(subtitle => {
            subtitle.checklist.forEach(item => {
                item.completed = false;
            });
            
            // Update subtitle completion status based on checklist items
            const allChecklistItemsCompleted = subtitle.checklist.every(c => c.completed);
            if (subtitle.checklist.length > 0) {
                subtitle.completed = allChecklistItemsCompleted;
            }
        });
        
        // Update title completion status based on subtitles
        const allSubtitlesCompleted = title.subtitles.every(s => s.completed);
        if (title.subtitles.length > 0) {
            title.completed = allSubtitlesCompleted;
        }
    });
    
    saveTasks();
}

// Show reset notice
function showResetNotice() {
    const notice = document.createElement('div');
    notice.className = 'reset-notice';
    notice.textContent = 'Checklists have been reset for a new day.';
    
    taskContainer.insertAdjacentElement('beforebegin', notice);
    
    // Remove notice after 5 seconds
    setTimeout(() => {
        notice.remove();
    }, 5000);
}

// Record daily completion status
function recordDailyCompletion() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = formatDate(yesterday);
    
    // Calculate completion status
    let totalTasks = 0;
    let completedTasks = 0;
    
    tasks.forEach(title => {
        title.subtitles.forEach(subtitle => {
            subtitle.checklist.forEach(item => {
                totalTasks++;
                if (item.completed) {
                    completedTasks++;
                }
            });
        });
    });
    
    let status = 'incomplete';
    if (totalTasks > 0) {
        if (completedTasks === totalTasks) {
            status = 'completed';
        } else if (completedTasks > 0) {
            status = 'partial';
        }
    }
    
    // Add to history
    taskHistory.unshift({
        date: yesterdayFormatted,
        status: status,
        completedTasks: completedTasks,
        totalTasks: totalTasks
    });
    
    // Limit history to last 30 days
    if (taskHistory.length > 30) {
        taskHistory = taskHistory.slice(0, 30);
    }
    
    saveHistory();
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Add new title
function addTitle(titleText) {
    const newTitle = {
        id: generateId(),
        text: titleText,
        completed: false,
        subtitles: [],
        expanded: false
    };
    
    tasks.push(newTitle);
    saveTasks();
    renderTasks();
}

// Add subtitle to a title
function addSubtitle(titleId, subtitleText) {
    const title = tasks.find(t => t.id === titleId);
    if (title) {
        const newSubtitle = {
            id: generateId(),
            text: subtitleText,
            completed: false,
            checklist: [],
            expanded: false
        };
        
        title.subtitles.push(newSubtitle);
        saveTasks();
        renderTasks();
    }
}

// Add checklist item to a subtitle
function addChecklistItem(titleId, subtitleId, checklistText) {
    const title = tasks.find(t => t.id === titleId);
    if (title) {
        const subtitle = title.subtitles.find(s => s.id === subtitleId);
        if (subtitle) {
            const newChecklistItem = {
                id: generateId(),
                text: checklistText,
                completed: false
            };
            
            subtitle.checklist.push(newChecklistItem);
            saveTasks();
            renderTasks();
        }
    }
}

// Toggle completion status of a title
function toggleTitleCompletion(titleId) {
    const title = tasks.find(t => t.id === titleId);
    if (title) {
        title.completed = !title.completed;
        
        // If title is marked as completed, mark all subtitles and checklist items as completed
        if (title.completed) {
            title.subtitles.forEach(subtitle => {
                subtitle.completed = true;
                subtitle.checklist.forEach(item => {
                    item.completed = true;
                });
            });
        }
        
        saveTasks();
        renderTasks();
    }
}

// Toggle completion status of a subtitle
function toggleSubtitleCompletion(titleId, subtitleId) {
    const title = tasks.find(t => t.id === titleId);
    if (title) {
        const subtitle = title.subtitles.find(s => s.id === subtitleId);
        if (subtitle) {
            subtitle.completed = !subtitle.completed;
            
            // If subtitle is marked as completed, mark all checklist items as completed
            if (subtitle.completed) {
                subtitle.checklist.forEach(item => {
                    item.completed = true;
                });
            }
            
            // Check if all subtitles are completed to update title status
            const allSubtitlesCompleted = title.subtitles.every(s => s.completed);
            if (allSubtitlesCompleted) {
                title.completed = true;
            } else {
                title.completed = false;
            }
            
            saveTasks();
            renderTasks();
        }
    }
}

// Toggle completion status of a checklist item
function toggleChecklistItemCompletion(titleId, subtitleId, checklistItemId) {
    const title = tasks.find(t => t.id === titleId);
    if (title) {
        const subtitle = title.subtitles.find(s => s.id === subtitleId);
        if (subtitle) {
            const checklistItem = subtitle.checklist.find(c => c.id === checklistItemId);
            if (checklistItem) {
                checklistItem.completed = !checklistItem.completed;
                
                // Check if all checklist items are completed to update subtitle status
                const allChecklistItemsCompleted = subtitle.checklist.every(c => c.completed);
                if (allChecklistItemsCompleted && subtitle.checklist.length > 0) {
                    subtitle.completed = true;
                } else {
                    subtitle.completed = false;
                }
                
                // Check if all subtitles are completed to update title status
                const allSubtitlesCompleted = title.subtitles.every(s => s.completed);
                if (allSubtitlesCompleted && title.subtitles.length > 0) {
                    title.completed = true;
                } else {
                    title.completed = false;
                }
                
                saveTasks();
                renderTasks();
            }
        }
    }
}

// Toggle expansion of a title
function toggleTitleExpansion(titleId) {
    const title = tasks.find(t => t.id === titleId);
    if (title) {
        title.expanded = !title.expanded;
        
        // If expanding, set as selected title
        if (title.expanded) {
            selectedTitleId = titleId;
        } else {
            selectedTitleId = null;
        }
        
        // Close other titles
        tasks.forEach(t => {
            if (t.id !== titleId) {
                t.expanded = false;
            }
        });
        
        renderTasks();
    }
}

// Toggle expansion of a subtitle
function toggleSubtitleExpansion(titleId, subtitleId) {
    const title = tasks.find(t => t.id === titleId);
    if (title) {
        const subtitle = title.subtitles.find(s => s.id === subtitleId);
        if (subtitle) {
            subtitle.expanded = !subtitle.expanded;
            
            // Close other subtitles in the same title
            title.subtitles.forEach(s => {
                if (s.id !== subtitleId) {
                    s.expanded = false;
                }
            });
            
            renderTasks();
        }
    }
}

// Delete a title
function deleteTitle(titleId) {
    tasks = tasks.filter(t => t.id !== titleId);
    saveTasks();
    renderTasks();
}

// Delete a subtitle
function deleteSubtitle(titleId, subtitleId) {
    const title = tasks.find(t => t.id === titleId);
    if (title) {
        title.subtitles = title.subtitles.filter(s => s.id !== subtitleId);
        saveTasks();
        renderTasks();
    }
}

// Delete a checklist item
function deleteChecklistItem(titleId, subtitleId, checklistItemId) {
    const title = tasks.find(t => t.id === titleId);
    if (title) {
        const subtitle = title.subtitles.find(s => s.id === subtitleId);
        if (subtitle) {
            subtitle.checklist = subtitle.checklist.filter(c => c.id !== checklistItemId);
            saveTasks();
            renderTasks();
        }
    }
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(tasks.length / itemsPerPage);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

// Render tasks for the current page
function renderTasks() {
    taskContainer.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageTasks = tasks.slice(startIndex, endIndex);
    
    currentPageTasks.forEach(title => {
        // Create title element
        const titleElement = document.createElement('div');
        titleElement.className = `task-item ${selectedTitleId === title.id ? 'selected' : ''}`;
        
        const titleHeader = document.createElement('div');
        titleHeader.className = 'task-title';
        titleHeader.addEventListener('click', () => toggleTitleExpansion(title.id));
        
        const titleText = document.createElement('div');
        titleText.className = `task-title-text ${title.completed ? 'completed' : ''}`;
        titleText.textContent = title.text;
        
        const titleActions = document.createElement('div');
        titleActions.className = 'task-actions';
        
        const toggleTitleBtn = document.createElement('button');
        toggleTitleBtn.textContent = title.completed ? '✓' : '○';
        toggleTitleBtn.title = title.completed ? 'Mark as not done' : 'Mark as done';
        toggleTitleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTitleCompletion(title.id);
        });
        
        const deleteTitleBtn = document.createElement('button');
        deleteTitleBtn.textContent = '🗑️';
        deleteTitleBtn.title = 'Delete title';
        deleteTitleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTitle(title.id);
        });
        
        titleActions.appendChild(toggleTitleBtn);
        titleActions.appendChild(deleteTitleBtn);
        
        titleHeader.appendChild(titleText);
        titleHeader.appendChild(titleActions);
        titleElement.appendChild(titleHeader);
        
        // Create subtitles container
        const subtitlesContainer = document.createElement('div');
        subtitlesContainer.className = `subtitles ${title.expanded ? '' : 'hidden'}`;
        
        // Add subtitle input
        const addSubtitleControls = document.createElement('div');
        addSubtitleControls.className = 'add-controls';
        
        const subtitleInput = document.createElement('input');
        subtitleInput.type = 'text';
        subtitleInput.placeholder = 'Add new subtitle...';
        
        const addSubtitleBtn = document.createElement('button');
        addSubtitleBtn.textContent = 'Add';
        addSubtitleBtn.addEventListener('click', () => {
            if (subtitleInput.value.trim()) {
                addSubtitle(title.id, subtitleInput.value.trim());
                subtitleInput.value = '';
            }
        });
        
        subtitleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && subtitleInput.value.trim()) {
                addSubtitle(title.id, subtitleInput.value.trim());
                subtitleInput.value = '';
            }
        });
        
        addSubtitleControls.appendChild(subtitleInput);
        addSubtitleControls.appendChild(addSubtitleBtn);
        subtitlesContainer.appendChild(addSubtitleControls);
        
        // Render subtitles
        title.subtitles.forEach(subtitle => {
            const subtitleElement = document.createElement('div');
            subtitleElement.className = 'subtitle-item';
            
            const subtitleHeader = document.createElement('div');
            subtitleHeader.className = 'subtitle-header';
            subtitleHeader.addEventListener('click', () => toggleSubtitleExpansion(title.id, subtitle.id));
            
            const subtitleText = document.createElement('div');
            subtitleText.className = `subtitle-text ${subtitle.completed ? 'completed' : ''}`;
            subtitleText.textContent = subtitle.text;
            
            const subtitleActions = document.createElement('div');
            subtitleActions.className = 'task-actions';
            
            const toggleSubtitleBtn = document.createElement('button');
            toggleSubtitleBtn.textContent = subtitle.completed ? '✓' : '○';
            toggleSubtitleBtn.title = subtitle.completed ? 'Mark as not done' : 'Mark as done';
            toggleSubtitleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleSubtitleCompletion(title.id, subtitle.id);
            });
            
            const deleteSubtitleBtn = document.createElement('button');
            deleteSubtitleBtn.textContent = '🗑️';
            deleteSubtitleBtn.title = 'Delete subtitle';
            deleteSubtitleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteSubtitle(title.id, subtitle.id);
            });
            
            subtitleActions.appendChild(toggleSubtitleBtn);
            subtitleActions.appendChild(deleteSubtitleBtn);
            
            subtitleHeader.appendChild(subtitleText);
            subtitleHeader.appendChild(subtitleActions);
            subtitleElement.appendChild(subtitleHeader);
            
            // Create checklist container
            const checklistContainer = document.createElement('div');
            checklistContainer.className = `checklist ${subtitle.expanded ? '' : 'hidden'}`;
            
            // Add checklist item input
            const addChecklistControls = document.createElement('div');
            addChecklistControls.className = 'add-controls';
            
            const checklistInput = document.createElement('input');
            checklistInput.type = 'text';
            checklistInput.placeholder = 'Add checklist item...';
            
            const addChecklistBtn = document.createElement('button');
            addChecklistBtn.textContent = 'Add';
            addChecklistBtn.addEventListener('click', () => {
                if (checklistInput.value.trim()) {
                    addChecklistItem(title.id, subtitle.id, checklistInput.value.trim());
                    checklistInput.value = '';
                }
            });
            
            checklistInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && checklistInput.value.trim()) {
                    addChecklistItem(title.id, subtitle.id, checklistInput.value.trim());
                    checklistInput.value = '';
                }
            });
            
            addChecklistControls.appendChild(checklistInput);
            addChecklistControls.appendChild(addChecklistBtn);
            checklistContainer.appendChild(addChecklistControls);
            
            // Render checklist items
            subtitle.checklist.forEach(item => {
                const checklistItemElement = document.createElement('div');
                checklistItemElement.className = 'checklist-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = item.completed;
                checkbox.addEventListener('change', () => {
                    toggleChecklistItemCompletion(title.id, subtitle.id, item.id);
                });
                
                const checklistText = document.createElement('div');
                checklistText.className = `checklist-text ${item.completed ? 'completed' : ''}`;
                checklistText.textContent = item.text;
                
                const deleteChecklistBtn = document.createElement('button');
                deleteChecklistBtn.textContent = '🗑️';
                deleteChecklistBtn.title = 'Delete checklist item';
                deleteChecklistBtn.addEventListener('click', () => {
                    deleteChecklistItem(title.id, subtitle.id, item.id);
                });
                
                checklistItemElement.appendChild(checkbox);
                checklistItemElement.appendChild(checklistText);
                checklistItemElement.appendChild(deleteChecklistBtn);
                checklistContainer.appendChild(checklistItemElement);
            });
            
            subtitleElement.appendChild(checklistContainer);
            subtitlesContainer.appendChild(subtitleElement);
        });
        
        titleElement.appendChild(subtitlesContainer);
        taskContainer.appendChild(titleElement);
    });
    
    updatePagination();
    renderHistory();
}

// Render task history
function renderHistory() {
    historyContainer.innerHTML = '';
    
    if (taskHistory.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.textContent = 'No history available yet. Complete tasks to build your history.';
        historyContainer.appendChild(emptyMessage);
        return;
    }
    
    // Display last 7 days of history
    const displayHistory = taskHistory.slice(0, 7);
    
    displayHistory.forEach(entry => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const dateElement = document.createElement('div');
        dateElement.className = 'history-date';
        
        // Convert YYYY-MM-DD to display format
        const dateParts = entry.date.split('-');
        const displayDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        dateElement.textContent = formatDisplayDate(displayDate);
        
        const statusElement = document.createElement('div');
        statusElement.className = `history-status ${entry.status}`;
        
        if (entry.status === 'completed') {
            statusElement.textContent = 'All tasks completed';
        } else if (entry.status === 'partial') {
            statusElement.textContent = `${entry.completedTasks}/${entry.totalTasks} tasks completed`;
        } else {
            statusElement.textContent = 'No tasks completed';
        }
        
        historyItem.appendChild(dateElement);
        historyItem.appendChild(statusElement);
        historyContainer.appendChild(historyItem);
    });
}

// Set up midnight reset check
function setupMidnightCheck() {
    // Check time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow - now;
    
    // Set timeout for midnight reset
    setTimeout(() => {
        checkAndResetChecklists();
        // Set up next check (run every 24 hours)
        setInterval(checkAndResetChecklists, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
}

// Event listeners
addTitleBtn.addEventListener('click', () => {
    if (newTitleInput.value.trim()) {
        addTitle(newTitleInput.value.trim());
        newTitleInput.value = '';
    }
});

newTitleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && newTitleInput.value.trim()) {
        addTitle(newTitleInput.value.trim());
        newTitleInput.value = '';
    }
});

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTasks();
    }
});

nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(tasks.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTasks();
    }
});

// Initialize app
updateCurrentDateDisplay();
loadTasks();
renderTasks();
setupMidnightCheck();

// Update date display every minute (in case user keeps app open past midnight)
setInterval(updateCurrentDateDisplay, 60000);