// Global state
let ws = null;
let currentRoomId = null;
let currentUser = null; // { role: 'admin'|'student', id: 1, name: 'John', displayName: 'Student 1' }
const pollVotes = {}; // Tracks votes for admin

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check which page we are on
    const path = window.location.pathname;

    // --- Admin Login Page ---
    if (path.endsWith('admin.html')) {
        const loginForm = document.getElementById('adminLoginForm');
        const createRoomForm = document.getElementById('createRoomForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const u = document.getElementById('username').value;
                const p = document.getElementById('password').value;
                
                if (u === 'admin' && p === 'admin123') {
                    sessionStorage.setItem('userRole', 'admin');
                    sessionStorage.setItem('userId', 'admin_' + Date.now()); 
                    document.getElementById('adminLoginSection').style.display = 'none';
                    document.getElementById('adminDashboardSection').style.display = 'block';
                } else {
                    document.getElementById('loginError').style.display = 'block';
                }
            });
        }

        if (createRoomForm) {
            createRoomForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const rp = document.getElementById('newRoomPassword').value;
                // Mock API call to create room
                const generatedRoomId = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits
                sessionStorage.setItem('roomId', generatedRoomId);
                sessionStorage.setItem('roomPassword', rp);
                
                document.getElementById('displayRoomId').innerText = generatedRoomId;
                document.getElementById('displayRoomPass').innerText = rp;
                document.getElementById('roomDetails').style.display = 'block';
            });
        }

        document.getElementById('enterAdminChatBtn')?.addEventListener('click', () => {
            window.location.href = 'chat.html';
        });
    }

    // --- Student Registration Page ---
    if (path.endsWith('register.html')) {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const student = {
                    name: document.getElementById('name').value,
                    regno: document.getElementById('regno').value,
                    college: document.getElementById('college').value,
                    year: document.getElementById('year').value,
                    department: document.getElementById('department').value
                };
                sessionStorage.setItem('studentDetails', JSON.stringify(student));
                window.location.href = 'join.html';
            });
        }
    }

    // --- Student Join Room Page ---
    if (path.endsWith('join.html')) {
        const joinForm = document.getElementById('joinRoomForm');
        if (joinForm) {
            joinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const rid = document.getElementById('roomId').value;
                const rpass = document.getElementById('roomPassword').value;
                
                const host = window.location.host || 'localhost:8080';
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const tempUserId = 'student_' + Date.now();
                const tempWsUrl = `${protocol}//${host}/conference_chatbox/chat/${rid}/${tempUserId}/student/${rpass}`;
                
                const joinErr = document.getElementById('joinError');
                joinErr.style.display = 'none';

                const tempWs = new WebSocket(tempWsUrl);
                
                tempWs.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'auth_success') {
                        tempWs.close(); // Successful auth!
                        sessionStorage.setItem('userRole', 'student');
                        sessionStorage.setItem('roomId', rid);
                        sessionStorage.setItem('roomPassword', rpass);
                        sessionStorage.setItem('userId', tempUserId); 
                        sessionStorage.setItem('displayName', 'Student ' + Math.floor(Math.random() * 100));
                        window.location.href = 'chat.html';
                    }
                };
                
                tempWs.onclose = (event) => {
                    if (event.reason === 'ROOM_NOT_FOUND') {
                        joinErr.innerText = "Room ID doesn't exist";
                        joinErr.style.display = 'block';
                    } else if (event.reason === 'INVALID_PASSWORD') {
                        joinErr.innerText = "Invalid password";
                        joinErr.style.display = 'block';
                    } else if (event.code !== 1000 && event.code !== 1005) {
                        joinErr.innerText = "Could not connect to server.";
                        joinErr.style.display = 'block';
                    }
                };
            });
        }
    }

    // --- Chat Room Page ---
    if (path.endsWith('chat.html')) {
        initChat();
    }
});

function initChat() {
    const role = sessionStorage.getItem('userRole');
    const roomId = sessionStorage.getItem('roomId');
    const userId = sessionStorage.getItem('userId');
    const displayName = role === 'admin' ? 'Admin' : sessionStorage.getItem('displayName');
    
    if (!role || !roomId) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('currentRoomId').innerText = roomId;
    document.getElementById('userRole').innerText = role === 'admin' ? '(Admin Mode)' : '(Student Mode)';

    if (role === 'admin') {
        document.getElementById('adminSidebar').style.display = 'flex';
        setupAdminControls();
    } else {
        // Send join notification (mocking DB storage for admin table)
        setTimeout(() => {
            const studentData = JSON.parse(sessionStorage.getItem('studentDetails'));
            if(ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'join',
                    role: 'student',
                    displayName: displayName,
                    actualName: studentData.name,
                    regNo: studentData.regno
                }));
            }
        }, 1000);
    }

    // Connect WebSocket
    const host = window.location.host || 'localhost:8080';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const roomPassword = sessionStorage.getItem('roomPassword');
    
    // In standard Tomcat setup, this URL maps to the @ServerEndpoint
    const wsUrl = `${protocol}//${host}/conference_chatbox/chat/${roomId}/${userId}/${role}/${roomPassword}`;
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('Connected to chat room');
    };

    ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        alert('Could not connect to the chat server! Check if Tomcat is running and the Java files were compiled correctly.');
    };

    ws.onclose = (event) => {
        console.log('Disconnected from chat room');
        if (event.reason === 'ROOM_CLOSED') {
            if (role === 'student') {
                alert("The Admin has closed this room.");
                sessionStorage.removeItem('roomId');
                window.location.href = 'index.html';
            }
        }
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat') {
            const isSelf = data.userId === userId;
            const senderName = isSelf ? 'You' : (role === 'admin' ? (data.actualName || data.displayName) : data.displayName);
            appendMessage(senderName, data.content, isSelf ? 'self' : 'other');
        } else if (data.type === 'mcq') {
            renderMCQ(data);
        } else if (data.type === 'join' && role === 'admin') {
            addStudentToTable(data);
        } else if (data.type === 'answer' && role === 'admin') {
            // Track votes for the admin
            if (!pollVotes[data.pollId]) {
                pollVotes[data.pollId] = { A: 0, B: 0, C: 0, D: 0, total: 0 };
            }
            pollVotes[data.pollId][data.selected]++;
            pollVotes[data.pollId].total++;
        } else if (data.type === 'reveal') {
            // Reveal percentages in the UI
            const mcqContainer = document.getElementById(`mcq-${data.pollId}`);
            if (mcqContainer) {
                const total = data.votes.total || 1; // prevent div by 0
                const options = mcqContainer.querySelectorAll('.mcq-option');
                options.forEach(opt => {
                    const optKey = opt.dataset.opt;
                    const voteCount = data.votes[optKey] || 0;
                    const percent = Math.round((voteCount / total) * 100);
                    
                    // Add background fill and text
                    opt.innerHTML += `<span class="mcq-percent">${percent}%</span>`;
                    opt.innerHTML += `<div class="mcq-progress" style="width: ${percent}%"></div>`;
                });
            }
        }
    };

    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const leaveBtn = document.getElementById('leaveBtn');

    leaveBtn.addEventListener('click', () => {
        sessionStorage.removeItem('roomId');
        if (ws) ws.close();
        window.location.href = role === 'admin' ? 'admin.html' : 'index.html';
    });

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;
        
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            alert("Not connected to the chat server yet. Please wait a moment or refresh the page.");
            return;
        }
        
        const studentData = role === 'student' ? JSON.parse(sessionStorage.getItem('studentDetails')) : {};

        const msgPayload = {
            type: 'chat',
            userId: userId,
            role: role,
            displayName: displayName,
            actualName: role === 'admin' ? 'Admin' : studentData.name,
            content: text
        };

        ws.send(JSON.stringify(msgPayload));
        messageInput.value = '';
    }

    function appendMessage(sender, text, type) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        msgDiv.innerHTML = `<span class="sender">${sender}</span><p style="margin:0">${text}</p>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function renderMCQ(data) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message other';
        
        const title = data.correctAnswer ? 'Admin (MCQ)' : 'Admin (Poll)';
        
        msgDiv.innerHTML = `
            <span class="sender">${title}</span>
            <p><strong>${data.question}</strong></p>
            <div class="mcq-container" id="mcq-${data.pollId}">
                ${data.optA ? `<div class="mcq-option" data-opt="A">${data.optA}</div>` : ''}
                ${data.optB ? `<div class="mcq-option" data-opt="B">${data.optB}</div>` : ''}
                ${data.optC ? `<div class="mcq-option" data-opt="C">${data.optC}</div>` : ''}
                ${data.optD ? `<div class="mcq-option" data-opt="D">${data.optD}</div>` : ''}
            </div>
        `;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (role === 'student') {
            const options = msgDiv.querySelectorAll('.mcq-option');
            options.forEach(opt => {
                opt.addEventListener('click', function() {
                    if (msgDiv.dataset.answered) return;
                    msgDiv.dataset.answered = 'true';
                    
                    const selected = this.dataset.opt;
                    
                    if (data.correctAnswer) {
                        // It's an MCQ
                        if (selected === data.correctAnswer) {
                            this.classList.add('correct');
                        } else {
                            this.classList.add('incorrect');
                            msgDiv.querySelector(`[data-opt="${data.correctAnswer}"]`).classList.add('correct');
                        }
                    } else {
                        // It's a Poll (no correct answer, just highlight selection)
                        this.classList.add('correct'); // reuse correct class for blue highlight
                    }

                    ws.send(JSON.stringify({
                        type: 'answer',
                        pollId: data.pollId,
                        userId: userId,
                        selected: selected
                    }));
                });
            });
        } else {
            // Admin view: highlight correct answer if it's an MCQ
            if (data.correctAnswer) {
                msgDiv.querySelector(`[data-opt="${data.correctAnswer}"]`).classList.add('correct');
            }
            
            // Add a Reveal Results button for Admin
            const revealBtn = document.createElement('button');
            revealBtn.className = 'btn btn-primary';
            revealBtn.style = 'margin-top: 1rem; padding: 0.5rem; font-size: 0.85rem; width: auto; align-self: flex-start;';
            revealBtn.innerText = 'Reveal Results to Students';
            revealBtn.onclick = () => {
                // Get tracked votes, or empty if no one voted
                const votes = pollVotes[data.pollId] || { A: 0, B: 0, C: 0, D: 0, total: 0 };
                ws.send(JSON.stringify({
                    type: 'reveal',
                    pollId: data.pollId,
                    votes: votes
                }));
                revealBtn.style.display = 'none'; // hide button after revealing
            };
            msgDiv.appendChild(revealBtn);
        }
    }

    function addStudentToTable(data) {
        const tbody = document.querySelector('#attendanceTable tbody');
        const tr = document.createElement('tr');
        const time = new Date().toLocaleTimeString();
        tr.innerHTML = `
            <td>${data.displayName}</td>
            <td>${data.actualName}</td>
            <td>${data.regNo}</td>
            <td>${time}</td>
        `;
        tbody.appendChild(tr);
    }
}

function setupAdminControls() {
    let mcqCount = 0; // Tracks number of MCQs sent to cycle the correct answer

    const mcqModal = document.getElementById('mcqModal');
    const mcqTypeSelect = document.getElementById('mcqType');
    const labelOptA = document.getElementById('labelOptA');
    const labelOptB = document.getElementById('labelOptB');
    const labelOptC = document.getElementById('labelOptC');
    const labelOptD = document.getElementById('labelOptD');
    
    const cancelMcqBtn = document.getElementById('cancelMcqBtn');
    const submitMcqBtn = document.getElementById('submitMcqBtn');
    const sendPollBtn = document.getElementById('sendPollBtn');
    const closeRoomBtn = document.getElementById('closeRoomBtn');
    const downloadAttendanceBtn = document.getElementById('downloadAttendanceBtn');

    function updateLabels(type) {
        if (type === 'poll') {
            labelOptA.innerText = 'Option A';
            labelOptB.innerText = 'Option B';
            labelOptC.innerText = 'Option C';
            labelOptD.innerText = 'Option D';
            labelOptA.style.color = '';
            labelOptB.style.color = '';
            labelOptC.style.color = '';
            labelOptD.style.color = '';
        } else {
            const cycle = ['C', 'A', 'D', 'B'];
            const nextCorrect = cycle[mcqCount % 4];
            
            labelOptA.innerText = nextCorrect === 'A' ? 'Option A (Correct Answer)' : 'Option A';
            labelOptB.innerText = nextCorrect === 'B' ? 'Option B (Correct Answer)' : 'Option B';
            labelOptC.innerText = nextCorrect === 'C' ? 'Option C (Correct Answer)' : 'Option C';
            labelOptD.innerText = nextCorrect === 'D' ? 'Option D (Correct Answer)' : 'Option D';
            
            labelOptA.style.color = nextCorrect === 'A' ? 'var(--success)' : '';
            labelOptB.style.color = nextCorrect === 'B' ? 'var(--success)' : '';
            labelOptC.style.color = nextCorrect === 'C' ? 'var(--success)' : '';
            labelOptD.style.color = nextCorrect === 'D' ? 'var(--success)' : '';
        }
    }

    mcqTypeSelect.addEventListener('change', (e) => {
        updateLabels(e.target.value);
    });

    sendPollBtn.addEventListener('click', () => {
        updateLabels(mcqTypeSelect.value);
        mcqModal.style.display = 'flex';
    });

    cancelMcqBtn.addEventListener('click', () => {
        mcqModal.style.display = 'none';
    });

    submitMcqBtn.addEventListener('click', () => {
        const type = mcqTypeSelect.value;
        const q = document.getElementById('mcqQuestion').value;
        const oA = document.getElementById('mcqOptA').value; 
        const oB = document.getElementById('mcqOptB').value;
        const oC = document.getElementById('mcqOptC').value;
        const oD = document.getElementById('mcqOptD').value;
        
        if (!q || !oA || !oB) return;
        
        mcqModal.style.display = 'none';
        
        let correctAns = null;

        if (type === 'mcq') {
            const cycle = ['C', 'A', 'D', 'B'];
            correctAns = cycle[mcqCount % 4];
            mcqCount++;
        }
        
        // Clear inputs for next time
        document.getElementById('mcqQuestion').value = '';
        document.getElementById('mcqOptA').value = '';
        document.getElementById('mcqOptB').value = '';
        document.getElementById('mcqOptC').value = '';
        document.getElementById('mcqOptD').value = '';
        
        const pollPayload = {
            type: 'mcq',
            pollId: Date.now(),
            question: q,
            optA: oA,
            optB: oB,
            optC: oC,
            optD: oD,
            correctAnswer: correctAns
        };

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(pollPayload));
        }
    });

    closeRoomBtn.addEventListener('click', () => {
        if(confirm("Are you sure you want to close this room?")) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'close_room' }));
            }
            setTimeout(() => {
                sessionStorage.removeItem('roomId');
                window.location.href = 'admin.html';
            }, 1000);
        }
    });

    downloadAttendanceBtn.addEventListener('click', () => {
        let csvContent = "data:text/csv;charset=utf-8,Display Name,Actual Name,Register No,Join Time\n";
        const rows = document.querySelectorAll('#attendanceTable tbody tr');
        rows.forEach(row => {
            const cols = row.querySelectorAll('td');
            const rowData = Array.from(cols).map(c => c.innerText).join(",");
            csvContent += rowData + "\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "attendance.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}
