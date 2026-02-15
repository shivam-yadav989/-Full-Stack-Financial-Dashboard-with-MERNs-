import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
// --- 1. DataLabels Plugin Import Karein ---
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

function App() {
  const [transactions, setTransactions] = useState([]);
  const [text, setText] = useState('');
  const [amount, setAmount] = useState(0);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authData, setAuthData] = useState({ name: '', email: '', password: '', isLogin: true });

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const getTransactions = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/transactions', config);
      setTransactions(res.data);
    } catch (err) {
      if (err.response?.status === 401) logout();
    }
  };

  useEffect(() => { getTransactions(); }, [token]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const url = authData.isLogin ? 'login' : 'register';
    try {
      const res = await axios.post(`http://localhost:5000/api/auth/${url}`, authData);
      if (authData.isLogin) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
      } else {
        alert("Registration Successful! Now Login.");
        setAuthData({ ...authData, isLogin: true });
      }
    } catch (err) { alert(err.response?.data?.message || "Error"); }
  };

  const logout = () => { localStorage.removeItem('token'); setToken(null); };

  const onSubmit = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:5000/api/transactions', { text, amount: +amount }, config);
    getTransactions();
    setText(''); setAmount(0);
  };

  const deleteTransaction = async (id) => {
    await axios.delete(`http://localhost:5000/api/transactions/${id}`, config);
    getTransactions();
  };

  const total = transactions.reduce((acc, item) => (acc += item.amount), 0).toFixed(2);

  // --- 🎨 Pie Chart Data & Internal Labels Configuration ---
  const chartData = {
    labels: transactions.map(t => t.text),
    datasets: [{
      data: transactions.map(t => Math.abs(t.amount)),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
        '#FF9F40', '#2ecc71', '#e74c3c', '#34495e', '#1abc9c'
      ],
      borderWidth: 2,
    }]
  };

  const chartOptions = {
    plugins: {
      legend: { display: false }, // Niche ki list hata di kyunki ab andar dikhega
      datalabels: {
        color: '#fff', // Text ka color white
        formatter: (value, context) => {
          // Slice ke andar Text aur Value dono dikhane ke liye
          return context.chart.data.labels[context.dataIndex] + '\n₹' + value;
        },
        font: {
          weight: 'bold',
          size: 12,
        },
        textAlign: 'center',
      }
    }
  };

  if (!token) {
    return (
      <div className="container">
        <h2 style={{textAlign:'center'}}>{authData.isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <form onSubmit={handleAuth}>
          {!authData.isLogin && <input type="text" placeholder="Name" onChange={e => setAuthData({...authData, name: e.target.value})} required />}
          <input type="email" placeholder="Email" onChange={e => setAuthData({...authData, email: e.target.value})} required />
          <input type="password" placeholder="Password" onChange={e => setAuthData({...authData, password: e.target.value})} required />
          <button className="btn">{authData.isLogin ? 'Login' : 'Register'}</button>
        </form>
        <p onClick={() => setAuthData({...authData, isLogin: !authData.isLogin})} style={{cursor:'pointer', textAlign:'center', marginTop:'15px', color:'blue'}}>
          {authData.isLogin ? 'New here? Register' : 'Have an account? Login'}
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{margin:0}}>"Full-Stack Financial Dashboard with MERN"</h2>
        <button onClick={logout} style={{background:'#e74c3c', color:'white', border:'none', padding:'8px 15px', borderRadius:'5px', cursor:'pointer'}}>Logout</button>
      </div>
      
      <div style={{textAlign:'center', margin:'30px 0'}}>
        <h1 style={{fontSize:'40px', margin:'0'}}>₹{total}</h1>
        <p style={{color:'#777', marginTop:'5px'}}>Current Balance</p>
        
        <div style={{ width: '320px', margin: '20px auto' }}>
          {transactions.length > 0 ? (
            <Pie data={chartData} options={chartOptions} />
          ) : (
            <div style={{padding:'40px', background:'#f4f4f4', borderRadius:'50%'}}>No Data</div>
          )}
        </div>
      </div>

      <h3 style={{borderBottom:'1px solid #bbb', paddingBottom:'10px'}}>History</h3>
      <ul className="list">
        {transactions.map(t => (
          <li key={t._id} className={t.amount < 0 ? 'minus' : 'plus'}>
            {t.text} <span>₹{t.amount}</span>
            <button onClick={() => deleteTransaction(t._id)} className="delete-btn">x</button>
          </li>
        ))}
      </ul>

      <h3 style={{marginTop:'30px'}}>Add New Transaction</h3>
      <form onSubmit={onSubmit}>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you spend on?" required />
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (e.g. -500 for expense)" required />
        <button className="btn" style={{background:'#9c88ff'}}>Add Transaction</button>
      </form>
    </div>
  );
}

export default App;
