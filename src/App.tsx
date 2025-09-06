import './App.css'
import hackathonGraphic from './assets/hackathon-graphic.svg'
import naverLogo from './assets/naver-logo.svg'

function App() {
  return (
    <div className="container">
      <div className="content">
        <img src={naverLogo} alt="NAVER Vietnam AI Hackathon" className="logo" />
        
        <div className="greeting">
          <p className="hello">Xin chào! 안녕하세요!</p>
          <p className="subtitle">Hello World</p>
        </div>
      </div>
      
      <img className="graphic" src={hackathonGraphic} alt="" />
    </div>
  )
}

export default App