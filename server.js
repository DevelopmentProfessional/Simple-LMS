const express = require('express');
const app = express();
app.use(express.json());
const path = require('path');
const fs = require('fs');
const PORT = process.env.PORT || 4848;

const onCallFile = path.join(__dirname, 'on_call.json');
const employeesFile = path.join(__dirname, 'employees.json');
const leaveTypesFile = path.join(__dirname, 'leave_types.json');
const teamsFile = path.join(__dirname, 'teams.json');
const userSettingsFile = path.join(__dirname, 'UserSettings.json');
const eventsFile = path.join(__dirname, 'events.json');

function parseCsvNames(csv, teamId) {
  return csv.split(',').map(s => {
    const [fname, lname] = s.trim().split(' ');
    return { fname, lname, teamId: teamId || null };
  });
}

function parseCsvLeaveTypes(csv) {
  return csv.split(',').map(s => ({ name: s.trim() }));
}

function readJson(file) {
  const data = fs.readFileSync(file, 'utf8');
  return JSON.parse(data);
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function readEvents() {
  const data = fs.readFileSync(eventsFile, 'utf8');
  return JSON.parse(data);
}

function writeEvents(events) {
  fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'calendar.html'));
});

app.get('/api/on-call', (req, res) => {
  const data = fs.readFileSync(onCallFile, 'utf8');
  res.json(JSON.parse(data));
});

app.post('/api/on-call', (req, res) => {
  const { name, start, end } = req.body;
  let onCall = [];
  onCall = JSON.parse(fs.readFileSync(onCallFile, 'utf8'));
  onCall.push({ name, start, end });
  fs.writeFileSync(onCallFile, JSON.stringify(onCall, null, 2));
  res.json({ success: true });
});

app.delete('/api/on-call/:idx', (req, res) => {
  let onCall = [];
  onCall = JSON.parse(fs.readFileSync(onCallFile, 'utf8'));
  const idx = parseInt(req.params.idx);
  onCall.splice(idx, 1);
  fs.writeFileSync(onCallFile, JSON.stringify(onCall, null, 2));
  res.json({ success: true });
});

app.get('/api/user-settings', (req, res) => {
  const data = fs.readFileSync(userSettingsFile, 'utf8');
  res.json(JSON.parse(data));
});

app.post('/api/user-settings', (req, res) => {
  const { darkMode } = req.body;
  const settings = { darkMode: !!darkMode };
  fs.writeFileSync(userSettingsFile, JSON.stringify(settings, null, 2));
  res.json(settings);
});

app.post('/api/employees', (req, res) => {
  const { name, teamId } = req.body;
  const employees = readJson(employeesFile);
  if (!name) return res.status(400).json({ success: false, error: 'Name required' });
  const names = name.split(';').map(n => n.trim()).filter(n => n);
  if (names.length === 0) return res.status(400).json({ success: false, error: 'No valid names' });
  const added = [];
  for (const n of names) {
    const emp = { name: n, teamId };
    employees.push(emp);
    added.push(emp);
  }
  writeJson(employeesFile, employees);
  res.status(201).json({ success: true, added });
});

app.post('/api/employees/csv', (req, res) => {
  const { csv, teamId } = req.body;
  const employees = parseCsvNames(csv, teamId);
  const allEmployees = readJson(employeesFile);
  employees.forEach(emp => allEmployees.push(emp));
  writeJson(employeesFile, allEmployees);
  res.json({ success: true, employees });
});

app.post('/api/employees/:index/team', (req, res) => {
  const { teamId } = req.body;
  const employees = readJson(employeesFile);
  const idx = parseInt(req.params.index, 10);
  employees[idx].teamId = teamId;
  writeJson(employeesFile, employees);
  res.json({ success: true, employee: employees[idx] });
});

app.delete('/api/employees/:index', (req, res) => {
  const employees = readJson(employeesFile);
  const idx = parseInt(req.params.index, 10);
  const removed = employees.splice(idx, 1);
  writeJson(employeesFile, employees);
  res.json({ success: true, removed });
});

app.patch('/api/employees/:index', (req, res) => {
  const employees = readJson(employeesFile);
  const idx = parseInt(req.params.index, 10);
  employees[idx] = { ...employees[idx], ...req.body };
  writeJson(employeesFile, employees);
  res.json({ success: true, employee: employees[idx] });
});

app.get('/api/teams', (req, res) => {
  res.json(readJson(teamsFile));
});

app.post('/api/teams', (req, res) => {
  const { name, color } = req.body;
  const teams = readJson(teamsFile);
  const newTeam = { id: Date.now().toString(), name, color };
  teams.push(newTeam);
  writeJson(teamsFile, teams);
  res.status(201).json(newTeam);
});

app.delete('/api/teams/:id', (req, res) => {
  const teams = readJson(teamsFile);
  const idx = teams.findIndex(t => t.id === req.params.id);
  const removed = teams.splice(idx, 1);
  writeJson(teamsFile, teams);
  res.json({ success: true, removed });
});

app.patch('/api/teams/:id', (req, res) => {
  const teams = readJson(teamsFile);
  const idx = teams.findIndex(t => t.id === req.params.id);
  teams[idx] = { ...teams[idx], ...req.body };
  writeJson(teamsFile, teams);
  res.json({ success: true, team: teams[idx] });
});

app.get('/api/employees', (req, res) => {
  res.json(readJson(employeesFile));
});

app.post('/api/leave-types', (req, res) => {
  const { name } = req.body;
  const leaveTypes = readJson(leaveTypesFile);
  const leaveType = { name };
  leaveTypes.push(leaveType);
  writeJson(leaveTypesFile, leaveTypes);
  res.status(201).json(leaveType);
});

app.post('/api/leave-types/csv', (req, res) => {
  const { csv } = req.body;
  const leaveTypes = parseCsvLeaveTypes(csv);
  writeJson(leaveTypesFile, leaveTypes);
  res.json({ success: true, leaveTypes });
});

app.delete('/api/leave-types/:index', (req, res) => {
  const leaveTypes = readJson(leaveTypesFile);
  const idx = parseInt(req.params.index, 10);
  const removed = leaveTypes.splice(idx, 1);
  writeJson(leaveTypesFile, leaveTypes);
  res.json({ success: true, removed });
});

app.patch('/api/leave-types/:index', (req, res) => {
  const leaveTypes = readJson(leaveTypesFile);
  const idx = parseInt(req.params.index, 10);
  leaveTypes[idx] = { ...leaveTypes[idx], ...req.body };
  writeJson(leaveTypesFile, leaveTypes);
  res.json({ success: true, leaveType: leaveTypes[idx] });
});

app.get('/api/leave-types', (req, res) => {
  res.json(readJson(leaveTypesFile));
});

app.get('/api/events', (req, res) => {
  const events = readEvents();
  const employees = readJson(employeesFile);
  const teams = readJson(teamsFile);
  const coloredEvents = events.map(ev => {
    let empName = ev.title.split(' - ')[0];
    let emp = employees.find(e => (e.fname + ' ' + e.lname) === empName);
    let color = '';
    if (emp && emp.teamId) {
      let team = teams.find(t => t.id === emp.teamId);
      if (team) color = team.color;
    }
    return { ...ev, color: color || undefined };
  });
  res.json(coloredEvents);
});

app.post('/api/events', (req, res) => {
  const events = readEvents();
  const newEvent = req.body;
  events.push(newEvent);
  writeEvents(events);
  res.status(201).json(newEvent);
});

app.delete('/api/events/:index', (req, res) => {
  const events = readEvents();
  const idx = parseInt(req.params.index, 10);
  const removed = events.splice(idx, 1);
  writeEvents(events);
  res.json({ success: true, removed });
});

app.patch('/api/events/:index', (req, res) => {
  const events = readEvents();
  const idx = parseInt(req.params.index, 10);
  events[idx] = { ...events[idx], ...req.body };
  writeEvents(events);
  res.json({ success: true, event: events[idx] });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});