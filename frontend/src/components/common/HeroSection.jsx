import React from 'react';
import '../../styles/common/HeroSection.css';
import bgImage from '../../assets/bg.png';

const HeroSection = () => {
  return (
    <>
    <section id="hero" className="hero-section">
      <div className="hero-background">
        <img src={bgImage} alt="Fresh Produce" className="hero-bg-image" />
      </div>
      <div className="hero-content">
        <h2>— WELCOME TO</h2>
        <h1>AGROMART</h1>
        <p>Grow Connection, Prosper Together</p>
      </div>
    </section>
    </>
  );
};

export default HeroSection; 
