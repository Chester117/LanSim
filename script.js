const { useState, useEffect } = React;

const RacingQueueSystem = () => {
    // All of your state and functions from the original component go here
    const [participants, setParticipants] = useState([]);
    const [ticketNumber, setTicketNumber] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [selectedPlayers, setSelectedPlayers] = useState({});
    const [simulators, setSimulators] = useState([
        { id: 1, name: '模拟器 1', status: 'idle', currentPlayer: null, startTime: null },
        { id: 2, name: '模拟器 2', status: 'idle', currentPlayer: null, startTime: null },
        { id: 3, name: '模拟器 3', status: 'idle', currentPlayer: null, startTime: null }
    ]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [dropdownOpen, setDropdownOpen] = useState({});
    const [lapTimeModal, setLapTimeModal] = useState({ show: false, participantId: null });
    const [lapTimeInput, setLapTimeInput] = useState({ minutes: '', seconds: '', milliseconds: '' });
    const [editModal, setEditModal] = useState({ show: false, participantId: null, type: null });
    const [editInput, setEditInput] = useState('');
    const [filterSettings, setFilterSettings] = useState({
        showAll: true,
        showCompleted: true,
        showPlaying: true,
        showWaiting: true,
        showWithoutLapTime: false
    });
    const [searchFilters, setSearchFilters] = useState({
        ticketNumber: '',
        name: ''
    });
    const [confirmModal, setConfirmModal] = useState({ show: false, step: 0 });

    const handleTicketNumberChange = (value) => {
        setTicketNumber(value);
        const existingParticipant = participants.find(p => p.ticketNumber === value.trim());
        if (existingParticipant && value.trim()) {
            setPlayerName(existingParticipant.name);
        } else if (!value.trim()) {
            setPlayerName('');
        }
    };

    const STORAGE_KEY = 'racing_queue_data';

    const saveData = (newParticipants, newSimulators) => {
        const data = {
            participants: newParticipants || participants,
            simulators: newSimulators || simulators,
            lastUpdated: new Date().toISOString()
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.log('数据保存失败（演示环境限制）');
        }
    };
    
    const loadData = () => {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                const data = JSON.parse(savedData);
                if (data.participants) {
                    const participantsWithDates = data.participants.map(p => ({
                        ...p,
                        queueTime: p.queueTime ? new Date(p.queueTime) : null,
                        playTime: p.playTime ? new Date(p.playTime) : null,
                        completedTime: p.completedTime ? new Date(p.completedTime) : null
                    }));
                    setParticipants(participantsWithDates);
                }
                if (data.simulators) {
                    const simulatorsWithDates = data.simulators.map(sim => ({
                        ...sim,
                        startTime: sim.startTime ? new Date(sim.startTime) : null
                    }));
                    setSimulators(simulatorsWithDates);
                }
            }
        } catch (error) {
            console.log('数据加载失败（演示环境限制）');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const syncInterval = setInterval(() => {
            loadData();
        }, 5000);
        return () => clearInterval(syncInterval);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Add a useEffect to re-render icons when the UI changes
    useEffect(() => {
        // We need a slight delay to allow React to update the DOM
        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    }, [participants, simulators, confirmModal, lapTimeModal, editModal]);


    const addParticipant = () => {
        if (!ticketNumber.trim() || !playerName.trim()) {
            alert('请输入完整的票号和姓名');
            return;
        }
        const existingParticipant = participants.find(p => p.ticketNumber === ticketNumber.trim());
        if (existingParticipant) {
            if (existingParticipant.name !== playerName.trim()) {
                alert(`错误：票号 ${ticketNumber.trim()} 已经在系统中，对应姓名为 "${existingParticipant.name}"。\n请确认票号或姓名是否正确。`);
                return;
            }
            if (existingParticipant.status === 'waiting') {
                alert('该参与者已在等待队列中');
                return;
            }
            if (existingParticipant.status === 'playing') {
                alert('该参与者正在游戏中');
                return;
            }
        }
        const finalName = existingParticipant ? existingParticipant.name : playerName.trim();
        const newParticipant = {
            id: Date.now(),
            ticketNumber: ticketNumber.trim(),
            name: finalName,
            status: 'waiting',
            queueTime: new Date(),
            playTime: null,
            completedTime: null,
            lapTime: null,
            gameSession: Date.now()
        };
        const newParticipants = [...participants, newParticipant];
        setParticipants(newParticipants);
        saveData(newParticipants, simulators);
        setTicketNumber('');
        setPlayerName('');
    };

    const getUniquePlayersByStatus = (status) => {
        const players = {};
        participants.filter(p => p.status === status).forEach(p => {
            const key = `${p.ticketNumber}-${p.name}`;
            players[key] = p;
        });
        return Object.values(players);
    };
    
    const getUniquePlayers = () => {
        const playersByTicket = {};
        participants.forEach(p => {
            const key = `${p.ticketNumber}-${p.name}`;
            playersByTicket[key] = p;
        });
        return Object.values(playersByTicket);
    };

    const waitingParticipants = participants.filter(p => p.status === 'waiting');
    const playingParticipants = participants.filter(p => p.status === 'playing');
    const completedParticipants = participants.filter(p => p.status === 'completed');
    
    const uniquePlayers = getUniquePlayers();
    const uniqueWaitingPlayers = getUniquePlayersByStatus('waiting');
    const uniquePlayingPlayers = getUniquePlayersByStatus('playing');
    const uniqueCompletedPlayers = getUniquePlayersByStatus('completed');

    const toggleDropdown = (simulatorId) => {
        setDropdownOpen(prev => ({ ...prev, [simulatorId]: !prev[simulatorId] }));
    };

    const selectPlayer = (simulatorId, playerId) => {
        setSelectedPlayers(prev => ({ ...prev, [simulatorId]: playerId }));
        setDropdownOpen(prev => ({ ...prev, [simulatorId]: false }));
    };

    const startGame = (simulatorId) => {
        const selectedPlayerId = selectedPlayers[simulatorId];
        if (!selectedPlayerId) {
            alert('请先选择一个参与者');
            return;
        }
        const selectedPlayer = participants.find(p => p.id === parseInt(selectedPlayerId));
        if (!selectedPlayer || selectedPlayer.status !== 'waiting') {
            alert('选择的参与者不在等待队列中');
            return;
        }
        const newSimulators = simulators.map(sim =>
            sim.id === simulatorId
                ? { ...sim, status: 'busy', currentPlayer: selectedPlayer, startTime: new Date() }
                : sim
        );
        setSimulators(newSimulators);
        const newParticipants = participants.map(p =>
            p.id === selectedPlayer.id
                ? { ...p, status: 'playing', playTime: new Date() }
                : p
        );
        setParticipants(newParticipants);
        saveData(newParticipants, newSimulators);
        setSelectedPlayers(prev => ({ ...prev, [simulatorId]: '' }));
    };

    const completeGame = (simulatorId) => {
        const simulator = simulators.find(sim => sim.id === simulatorId);
        if (!simulator || !simulator.currentPlayer) return;
        const playerId = simulator.currentPlayer.id;
        const newSimulators = simulators.map(sim =>
            sim.id === simulatorId
                ? { ...sim, status: 'idle', currentPlayer: null, startTime: null }
                : sim
        );
        setSimulators(newSimulators);
        const newParticipants = participants.map(p =>
            p.id === playerId
                ? { ...p, status: 'completed', completedTime: new Date() }
                : p
        );
        setParticipants(newParticipants);
        saveData(newParticipants, newSimulators);
        setLapTimeModal({ show: true, participantId: playerId });
        setLapTimeInput({ minutes: '', seconds: '', milliseconds: '' });
    };

    const updateLapTime = (participantId) => {
        const participant = participants.find(p => p.id === participantId);
        if (!participant) return;
        if (participant.lapTime) {
            const minutes = Math.floor(participant.lapTime / 60);
            const totalSeconds = participant.lapTime % 60;
            const seconds = Math.floor(totalSeconds);
            const milliseconds = Math.round((totalSeconds - seconds) * 1000);
            setLapTimeInput({
                minutes: minutes.toString(),
                seconds: seconds.toString(),
                milliseconds: milliseconds.toString()
            });
        } else {
            setLapTimeInput({ minutes: '', seconds: '', milliseconds: '' });
        }
        setLapTimeModal({ show: true, participantId });
    };
    
    const saveLapTime = () => {
        const { minutes, seconds, milliseconds } = lapTimeInput;
        const minutesNum = parseInt(minutes) || 0;
        const secondsNum = parseInt(seconds) || 0;
        const millisecondsNum = parseInt(milliseconds) || 0;
        if (secondsNum >= 60) {
            alert('秒数不能超过59');
            return;
        }
        if (millisecondsNum >= 1000) {
            alert('毫秒数不能超过999');
            return;
        }
        if (minutesNum === 0 && secondsNum === 0 && millisecondsNum === 0) {
            alert('请输入有效的圈速时间');
            return;
        }
        const lapTimeSeconds = minutesNum * 60 + secondsNum + millisecondsNum / 1000;
        const participant = participants.find(p => p.id === lapTimeModal.participantId);
        const newParticipants = participants.map(p => {
            if (p.id === lapTimeModal.participantId) {
                const newLapTime = !p.lapTime || lapTimeSeconds < p.lapTime ? lapTimeSeconds : p.lapTime;
                const isNewRecord = lapTimeSeconds < (p.lapTime || Infinity);
                setTimeout(() => {
                    if (isNewRecord) {
                        alert(`圈速已更新为: ${formatLapTime(lapTimeSeconds)}${p.lapTime ? ' (新记录!)' : ''}`);
                    } else {
                        alert(`保持原有最佳圈速: ${formatLapTime(p.lapTime)}\n输入的圈速较慢，未更新`);
                    }
                }, 100);
                return { ...p, lapTime: newLapTime };
            }
            return p;
        });
        setParticipants(newParticipants);
        saveData(newParticipants, simulators);
        setLapTimeModal({ show: false, participantId: null });
    };

    const cancelLapTime = () => {
        setLapTimeModal({ show: false, participantId: null });
        setLapTimeInput({ minutes: '', seconds: '', milliseconds: '' });
    };

    const editParticipant = (participantId, type) => {
        const participant = participants.find(p => p.id === participantId);
        if (!participant) return;
        setEditModal({ show: true, participantId, type });
        setEditInput(type === 'name' ? participant.name : participant.ticketNumber);
    };

    const saveEdit = () => {
        if (!editInput.trim()) {
            alert('请输入有效内容');
            return;
        }
        const { participantId, type } = editModal;
        if (type === 'ticketNumber') {
            const existing = participants.find(p => p.id !== participantId && p.ticketNumber === editInput.trim());
            if (existing) {
                alert('该票号已被其他参与者使用');
                return;
            }
        }
        const newParticipants = participants.map(p => {
            if (p.id === participantId) {
                return { ...p, [type === 'name' ? 'name' : 'ticketNumber']: editInput.trim() };
            }
            return p;
        });
        setParticipants(newParticipants);
        saveData(newParticipants, simulators);
        setEditModal({ show: false, participantId: null, type: null });
        setEditInput('');
    };

    const cancelEdit = () => {
        setEditModal({ show: false, participantId: null, type: null });
        setEditInput('');
    };

    const getFilteredParticipants = () => {
        const playerGroups = {};
        participants.forEach(p => {
            const key = `${p.ticketNumber}-${p.name}`;
            if (!playerGroups[key]) {
                playerGroups[key] = {
                    ticketNumber: p.ticketNumber,
                    name: p.name,
                    records: []
                };
            }
            playerGroups[key].records.push(p);
        });
        const playersList = Object.values(playerGroups).map(group => {
            const records = group.records.sort((a, b) => new Date(a.queueTime) - new Date(b.queueTime));
            const lapTimes = records.filter(r => r.lapTime).map(r => r.lapTime);
            const bestLapTime = lapTimes.length > 0 ? Math.min(...lapTimes) : null;
            const hasWaiting = records.some(r => r.status === 'waiting');
            const hasPlaying = records.some(r => r.status === 'playing');
            const completedCount = records.filter(r => r.status === 'completed').length;
            let overallStatus;
            if (hasPlaying) overallStatus = 'playing';
            else if (hasWaiting) overallStatus = 'waiting';
            else if (completedCount > 0) overallStatus = 'completed';
            else overallStatus = 'unknown';
            return {
                ...group,
                records,
                bestLapTime,
                lapTimes,
                overallStatus,
                totalGames: records.length,
                completedGames: completedCount,
                firstSignupTime: records[0].queueTime,
                lastActivity: records[records.length - 1].completedTime || records[records.length - 1].queueTime
            };
        });
        let filtered = playersList;
        if (!filterSettings.showAll) {
            filtered = filtered.filter(player => {
                if (filterSettings.showCompleted && player.overallStatus === 'completed') return true;
                if (filterSettings.showPlaying && player.overallStatus === 'playing') return true;
                if (filterSettings.showWaiting && player.overallStatus === 'waiting') return true;
                return false;
            });
        }
        if (filterSettings.showWithoutLapTime) {
            filtered = filtered.filter(player => !player.bestLapTime);
        }
        if (searchFilters.ticketNumber.trim()) {
            filtered = filtered.filter(player =>
                player.ticketNumber.toLowerCase().includes(searchFilters.ticketNumber.trim().toLowerCase())
            );
        }
        if (searchFilters.name.trim()) {
            filtered = filtered.filter(player =>
                player.name.toLowerCase().includes(searchFilters.name.trim().toLowerCase())
            );
        }
        return filtered;
    };
    
    const getPlayerStatusStyle = (player) => {
        const hasLapTime = player.bestLapTime !== null;
        switch (player.overallStatus) {
            case 'completed':
                return hasLapTime ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200';
            case 'playing':
                return 'bg-blue-50 border-blue-200';
            case 'waiting':
                return 'bg-gray-50 border-gray-200';
            default:
                return 'bg-white border-gray-200';
        }
    };
    
    const getPlayerStatusText = (player) => {
        const hasLapTime = player.bestLapTime !== null;
        switch (player.overallStatus) {
            case 'completed':
                return hasLapTime ? '已完成 ✓' : '已完成 (待记录圈速)';
            case 'playing':
                return '游戏中 🎮';
            case 'waiting':
                return '等待中 ⏳';
            default:
                return '未知状态';
        }
    };

    const clearAllData = () => {
        setConfirmModal({ show: true, step: 1 });
    };
    
    const confirmClearData = () => {
        if (confirmModal.step === 1) {
            setConfirmModal({ show: true, step: 2 });
        } else if (confirmModal.step === 2) {
            const initialSimulators = [
                { id: 1, name: '模拟器 1', status: 'idle', currentPlayer: null, startTime: null },
                { id: 2, name: '模拟器 2', status: 'idle', currentPlayer: null, startTime: null },
                { id: 3, name: '模拟器 3', status: 'idle', currentPlayer: null, startTime: null }
            ];
            setParticipants([]);
            setSimulators(initialSimulators);
            setSelectedPlayers({});
            setDropdownOpen({});
            setFilterSettings({
                showAll: true,
                showCompleted: true,
                showPlaying: true,
                showWaiting: true,
                showWithoutLapTime: false
            });
            setSearchFilters({ ticketNumber: '', name: '' });
            saveData([], initialSimulators);
            setConfirmModal({ show: false, step: 0 });
            setTimeout(() => {
                setConfirmModal({ show: true, step: 3 });
            }, 100);
        }
    };

    const cancelClearData = () => {
        setConfirmModal({ show: false, step: 0 });
    };

    const getPlayDuration = (startTime) => {
        if (!startTime) return '';
        const startTimeDate = startTime instanceof Date ? startTime : new Date(startTime);
        const duration = Math.floor((currentTime - startTimeDate) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatTime = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatLapTime = (lapTimeSeconds) => {
        if (!lapTimeSeconds) return '未记录';
        const minutes = Math.floor(lapTimeSeconds / 60);
        const seconds = (lapTimeSeconds % 60).toFixed(3);
        return `${minutes}:${seconds.padStart(6, '0')}`;
    };
    
    const calculateTimeDelta = (lapTime, bestLapTime) => {
        if (!lapTime || !bestLapTime || lapTime === bestLapTime) return '';
        const delta = lapTime - bestLapTime;
        const minutes = Math.floor(delta / 60);
        const seconds = (delta % 60).toFixed(3);
        if (minutes > 0) {
            return `+${minutes}:${seconds.padStart(6, '0')}`;
        } else {
            return `+${seconds}s`;
        }
    };

    const getGlobalBestLapTime = () => {
        const allLapTimes = participants
            .filter(p => p.lapTime)
            .map(p => p.lapTime)
            .sort((a, b) => a - b);
        return allLapTimes.length > 0 ? allLapTimes[0] : null;
    };
    
    const getLeaderboard = () => {
        const playerBestTimes = {};
        participants.forEach(p => {
            if (p.lapTime) {
                const key = `${p.ticketNumber}-${p.name}`;
                if (!playerBestTimes[key] || p.lapTime < playerBestTimes[key].lapTime) {
                    playerBestTimes[key] = {
                        ...p,
                        allRecords: participants.filter(record =>
                            record.ticketNumber === p.ticketNumber && record.name === p.name && record.lapTime
                        ).length
                    };
                }
            }
        });
        return Object.values(playerBestTimes)
            .sort((a, b) => a.lapTime - b.lapTime)
            .slice(0, 10);
    };

    const bestLapTime = getGlobalBestLapTime();
    const leaderboard = getLeaderboard();

    return (
        <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
            {/* ... The rest of your JSX from the return statement goes here ... */}
            {/* The following is a truncated version of your JSX with icon components replaced */}
            {confirmModal.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
                    {/* ... confirm modal JSX ... */}
                </div>
            )}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center">
                    <i data-lucide="monitor" className="mr-3 text-blue-600"></i>
                    <h1 className="text-3xl font-bold text-gray-800">赛车模拟器排号管理系统</h1>
                </div>
                <p className="text-gray-600">观影活动 - 圈速挑战赛</p>
                <div className="mt-2 text-sm text-green-600">
                    🔄 多端同步功能已启用 - 数据将在所有设备间同步
                </div>
            </div>

            {/* Statistics Panel */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                        <i data-lucide="users" className="h-8 w-8 text-blue-500"></i>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">总参与者</p>
                            <p className="text-2xl font-bold text-gray-900">{uniquePlayers.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                        <i data-lucide="clock" className="h-8 w-8 text-yellow-500"></i>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">等待中</p>
                            <p className="text-2xl font-bold text-gray-900">{uniqueWaitingPlayers.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                        <i data-lucide="play" className="h-8 w-8 text-green-500"></i>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">游戏中</p>
                            <p className="text-2xl font-bold text-gray-900">{uniquePlayingPlayers.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                        <i data-lucide="check-circle" className="h-8 w-8 text-purple-500"></i>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">已完成</p>
                            <p className="text-2xl font-bold text-gray-900">{uniqueCompletedPlayers.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                        <i data-lucide="trophy" className="h-8 w-8 text-amber-500"></i>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">最佳圈速</p>
                            <p className="text-lg font-bold text-gray-900">
                                {bestLapTime ? formatLapTime(bestLapTime) : '暂无'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Check-in Area */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">参与者签到</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                纸质票号
                            </label>
                            <input
                                type="text"
                                value={ticketNumber}
                                onChange={(e) => handleTicketNumberChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="输入票号"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                参与者姓名
                            </label>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="输入姓名"
                            />
                        </div>
                        <button
                            onClick={addParticipant}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center"
                        >
                            <i data-lucide="plus" className="w-4 h-4 mr-2"></i>
                            添加到队列
                        </button>
                    </div>
                </div>
                {/* Simulator Status */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">模拟器状态</h2>
                    <div className="space-y-4">
                        {simulators.map(simulator => (
                            <div key={simulator.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-800">{simulator.name}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${simulator.status === 'idle' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {simulator.status === 'idle' ? '空闲' : '使用中'}
                                    </span>
                                </div>
                                {simulator.currentPlayer ? (
                                    <div className="text-sm text-gray-600 mb-3">
                                        <p><strong>当前玩家:</strong> {simulator.currentPlayer.name}</p>
                                        <p><strong>票号:</strong> {simulator.currentPlayer.ticketNumber}</p>
                                        <p><strong>游戏时长:</strong> {getPlayDuration(simulator.startTime)}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 mb-3">暂无玩家</p>
                                )}
                                {simulator.status === 'idle' && waitingParticipants.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <button
                                                onClick={() => toggleDropdown(simulator.id)}
                                                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <span>
                                                    {selectedPlayers[simulator.id] ?
                                                        waitingParticipants.find(p => p.id.toString() === selectedPlayers[simulator.id])?.name || '选择玩家'
                                                        : '选择玩家'}
                                                </span>
                                                <i data-lucide="chevron-down" className="w-4 h-4"></i>
                                            </button>
                                            {dropdownOpen[simulator.id] && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                    {waitingParticipants.map((participant) => (
                                                        <button
                                                            key={participant.id}
                                                            onClick={() => selectPlayer(simulator.id, participant.id.toString())}
                                                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            {participant.name} ({participant.ticketNumber})
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => startGame(simulator.id)}
                                            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center"
                                            disabled={!selectedPlayers[simulator.id]}
                                        >
                                            <i data-lucide="play" className="w-4 h-4 mr-2"></i>
                                            开始游戏
                                        </button>
                                    </div>
                                )}
                                {simulator.status === 'busy' && (
                                    <button
                                        onClick={() => completeGame(simulator.id)}
                                        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center justify-center"
                                    >
                                        <i data-lucide="check-circle" className="w-4 h-4 mr-2"></i>
                                        完成游戏
                                    </button>
                                )}
                                {simulator.status === 'idle' && waitingParticipants.length === 0 && (
                                     <p className="text-sm text-gray-500">没有等待中的玩家</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

ReactDOM.render(<RacingQueueSystem />, document.getElementById('root'));