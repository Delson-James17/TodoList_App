import { useEffect, useState } from 'react'
import './App.css'

type Todo = { id: string; text: string; completed: boolean }
type Filter = 'All tasks' | 'Active' | 'Completed'
const initialTodos: Todo[] = [
  { id: '1', text: 'Plan the week ahead', completed: false },
  { id: '2', text: 'Read 10 pages of a book', completed: false },
  { id: '3', text: 'Go for an afternoon walk', completed: false },
  { id: '4', text: 'Make time for a little creativity', completed: false },
  { id: '5', text: 'Drink a glass of water', completed: true },
]
function readTodos(): Todo[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('little-list-todos') ?? 'null')
    if (Array.isArray(saved) && saved.every(t => t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.completed === 'boolean')) return saved
  } catch { /* Start with examples when storage is unavailable or invalid. */ }
  return initialTodos
}
function readTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem('little-list-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* Use the system preference when storage is unavailable. */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
function App() {
  const [theme, setTheme] = useState(readTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    try { localStorage.setItem('little-list-theme', next) }
    catch { /* Switching themes still works without persistent storage. */ }
  }
  const [todos, updateTodos] = useState<Todo[]>(readTodos)
  const [text, setText] = useState('')
  const [filter, setFilter] = useState<Filter>('All tasks')
  const [storageError, setStorageError] = useState(false)
  function setTodos(next: Todo[]) {
    updateTodos(next)
    try { localStorage.setItem('little-list-todos', JSON.stringify(next)); setStorageError(false) }
    catch { setStorageError(true) }
  }
  const completed = todos.filter(t => t.completed).length
  const visible = todos.filter(t => filter === 'All tasks' || (filter === 'Completed' ? t.completed : !t.completed))
  const progress = todos.length ? Math.round(completed / todos.length * 100) : 0

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="./"><span className="brand-icon">✓</span> little list<span className="brand-dot">.</span></a>
        <span className="header-note">A little focus. A little progress.</span>
        <div className="header-actions">
          <span className="personal-space"><span /> Personal space</span>
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        </div>
      </header>
      <main>
        <div className="intro">
          <div className="eyebrow"><span /> MAKE ROOM FOR WHAT MATTERS</div>
          <h1>Small steps.<br /><span>Good things ahead.</span></h1>
          <p>A clear mind starts with a little list.<br className="mobile-break" /> What would you like to get done?</p>
          <div className="doodle" aria-hidden="true"><span className="spark spark-one">✦</span><span className="flower">✳</span><span className="spark spark-two">✧</span><span className="doodle-caption">one thing at a time</span></div>
        </div>

        <section className="todo-card" aria-label="Your todo list">
          <div className="card-heading"><div><h2>My tasks <span>{todos.length}</span></h2><p>Big plans start with small actions.</p></div><span className="list-symbol" aria-hidden="true">☷</span></div>
          <form onSubmit={event => { event.preventDefault(); if (!text.trim()) return; setTodos([...todos, { id: crypto.randomUUID(), text: text.trim(), completed: false }]); setText('') }}>
            <span className="input-plus" aria-hidden="true">＋</span>
            <input aria-label="New task" placeholder="Add something to your list…" value={text} maxLength={200} onChange={event => setText(event.target.value)} />
            <button className="add-button" disabled={!text.trim()} type="submit">Add task <span aria-hidden="true">＋</span></button>
          </form>
          <div className="list-toolbar"><div className="filters" aria-label="Filter tasks">{(['All tasks', 'Active', 'Completed'] as Filter[]).map(item => <button key={item} aria-pressed={filter === item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><span className="remaining">{todos.length - completed} left to do</span></div>
          <ul className="task-list">{visible.map(todo => <li key={todo.id} className={todo.completed ? 'is-completed' : ''}><label><input type="checkbox" checked={todo.completed} onChange={() => setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t))} /><span>{todo.text}</span></label><button className="delete-button" aria-label={`Delete ${todo.text}`} onClick={() => setTodos(todos.filter(t => t.id !== todo.id))}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7m4-7v7" /></svg></button></li>)}</ul>
          {visible.length === 0 && <div className="empty-state"><span>✓</span><h3>{filter === 'Completed' ? 'Good things take a first step.' : 'A little breathing room.'}</h3><p>{filter === 'Completed' ? 'Your completed tasks will appear here.' : 'Add a new task whenever you’re ready.'}</p></div>}
          <div className="card-footer"><span><span className="small-check">✓</span> {completed} of {todos.length} completed</span><button disabled={completed === 0} onClick={() => setTodos(todos.filter(t => !t.completed))}>Clear completed</button></div>
        </section>
        <section className="progress-card" aria-label="Your progress"><div className="progress-icon" aria-hidden="true">↗</div><div className="progress-copy"><strong>A little progress, every day.</strong><p>{progress === 100 ? 'You did it. Enjoy a well-earned pause.' : 'You don’t have to do it all. Just take the next step.'}</p></div><div className="progress-meter"><div><span>Today’s progress</span><strong>{progress}%</strong></div><progress max="100" value={progress} aria-label="Task completion" /></div></section>
        <p className="save-note">{storageError ? 'Changes cannot be saved in this browser.' : '⌁  Your list is saved automatically in this browser.'}</p>
      </main>
      <footer className="site-footer"><span>Less clutter. More clarity.</span><span>Made for your everyday <span className="footer-flower">✳</span></span></footer>
    </div>
  )
}
export default App


