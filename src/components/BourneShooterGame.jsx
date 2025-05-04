import { useState, useEffect, useRef } from 'react';
import { X, Target, Crosshair, Trophy, Clock, Heart, Shield } from 'lucide-react';

// Game constants
const GAME_DURATION = 60; // seconds
const TARGET_SPAWN_RATE = 3000; // ms
const MAX_HEALTH = 3;
const BULLET_SPEED = 10; // pixels per frame

export default function BourneShooterGame() {
  // Game state
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [targets, setTargets] = useState([]);
  const [bullets, setBullets] = useState([]);
  const [health, setHealth] = useState(MAX_HEALTH);
  const [highScores, setHighScores] = useState([
    { name: 'Jason Bourne', score: 42 },
    { name: 'Nicky Parsons', score: 37 },
    { name: 'Pamela Landy', score: 32 },
    { name: 'Aaron Cross', score: 29 },
    { name: 'Alexander Conklin', score: 25 },
  ]);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [crosshairPosition, setCrosshairPosition] = useState({ x: 0, y: 0 });

  const gameAreaRef = useRef(null);
  const targetSpawnRef = useRef(null);
  const timerRef = useRef(null);
  const animationRef = useRef(null);

  // Track mouse movement for crosshair
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        setCrosshairPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    if (gameActive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameActive]);

  // Add touch event handlers for mobile support
  useEffect(() => {
    const handleTouchMove = (e) => {
      if (gameAreaRef.current && e.touches && e.touches[0]) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        setCrosshairPosition({
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        });
        
        // Prevent scrolling while playing
        e.preventDefault();
      }
    };
    
    const handleTouchStart = (e) => {
      if (gameAreaRef.current && e.touches && e.touches[0]) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        setCrosshairPosition({
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        });
        
        // Shoot on touch
        if (gameActive) {
          shootBullet();
        }
        
        // Prevent scrolling while playing
        e.preventDefault();
      }
    };

    if (gameActive) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchstart', handleTouchStart, { passive: false });
    }

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [gameActive]);

  // Start the game
  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setTargets([]);
    setHealth(MAX_HEALTH);
    setShowNameInput(false);

    // Set up timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set up target spawning
    targetSpawnRef.current = setInterval(() => {
      spawnTarget();
    }, TARGET_SPAWN_RATE);
  };

  // End the game
  const endGame = () => {
    clearInterval(timerRef.current);
    clearInterval(targetSpawnRef.current);
    setGameActive(false);
    setGameOver(true);

    // Check if the score is a high score
    const lowestHighScore =
      highScores.length >= 5 ? highScores[highScores.length - 1].score : 0;
    if (score > lowestHighScore || highScores.length < 5) {
      setShowNameInput(true);
    }
  };

  // Spawn a new target
  const spawnTarget = () => {
    if (!gameAreaRef.current) return;

    const gameArea = gameAreaRef.current.getBoundingClientRect();
    const targetSize = Math.random() * 40 + 30; // Random size between 30-70px
    
    // Define player area height (bottom 20% of game area)
    const playerAreaHeight = gameArea.height * 0.2;
    // Only spawn targets in the upper 80% of the game area
    const targetAreaHeight = gameArea.height - playerAreaHeight;

    const newTarget = {
      id: Date.now(),
      x: Math.random() * (gameArea.width - targetSize),
      y: Math.random() * (targetAreaHeight - targetSize), // Only spawn in upper area
      size: targetSize,
      timeToLive: Math.random() * 2000 + 1000, // Random TTL between 1-3 seconds
      dangerous: Math.random() > 0.7, // 30% chance of being a "civilian" (dangerous to hit)
    };

    setTargets((prev) => [...prev, newTarget]);

    // Target disappears after its time to live
    setTimeout(() => {
      setTargets((prev) => {
        const targetIndex = prev.findIndex((t) => t.id === newTarget.id);
        if (targetIndex !== -1) {
          // If a target wasn't hit and was dangerous, reduce health
          if (!newTarget.dangerous) {
            setHealth((h) => Math.max(0, h - 1));
            if (health <= 1) {
              endGame();
            }
          }
          return prev.filter((t) => t.id !== newTarget.id);
        }
        return prev;
      });
    }, newTarget.timeToLive);
  };

  // Handle shooting targets
  const handleShoot = () => {
    if (!gameActive) return;
    shootBullet();
  };

  // Add to imports

  // Add to game state

  // Add this function to handle bullet creation
  const shootBullet = () => {
    if (!gameActive) return;
    
    const gameAreaHeight = gameAreaRef.current.getBoundingClientRect().height;
    const playerY = gameAreaHeight * 0.8; // Player is at the dividing line (80% from top)
    
    const newBullet = {
      id: Date.now(),
      x: crosshairPosition.x,
      y: playerY - 20, // Bullet starts from the top of the player
      speed: BULLET_SPEED
    };
    
    setBullets(prev => [...prev, newBullet]);
  };

  // Add this effect to handle bullet movement and collision detection
  useEffect(() => {
    if (!gameActive) return;
    
    const updateGame = () => {
      // Check for collisions between bullets and targets
      setBullets(prev => {
        const remainingBullets = [...prev];
        
        // Check each bullet against each target
        setTargets(currentTargets => {
          let newTargets = [...currentTargets];
          let scoreChange = 0;
          
          for (let i = remainingBullets.length - 1; i >= 0; i--) {
            const bullet = remainingBullets[i];
            
            for (let j = newTargets.length - 1; j >= 0; j--) {
              const target = newTargets[j];
              
              // Simple collision detection
              const dx = bullet.x - (target.x + target.size/2);
              const dy = bullet.y - (target.y + target.size/2);
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < target.size/2) {
                // Hit a target
                if (target.dangerous) {
                  // Hit civilian (bad)
                  setHealth(h => Math.max(0, h - 1));
                  scoreChange -= 5;
                } else {
                  // Hit enemy (good)
                  scoreChange += 10;
                }
                
                // Remove the bullet and target
                remainingBullets.splice(i, 1);
                newTargets.splice(j, 1);
                break;
              }
            }
          }
          
          // Update score
          if (scoreChange !== 0) {
            setScore(s => s + scoreChange);
          }
          
          return newTargets;
        });
        
        // Move remaining bullets upward
        return remainingBullets
          .filter(bullet => bullet.y > 0)
          .map(bullet => ({
            ...bullet,
            y: bullet.y - bullet.speed
          }));
      });
      
      animationRef.current = requestAnimationFrame(updateGame);
    };
    
    animationRef.current = requestAnimationFrame(updateGame);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameActive]);

  // Save high score
  const saveHighScore = () => {
    if (!playerName.trim()) return;

    const newHighScore = { name: playerName, score };
    const updatedHighScores = [...highScores, newHighScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setHighScores(updatedHighScores);
    setShowNameInput(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(targetSpawnRef.current);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // If health reaches 0, end game
  useEffect(() => {
    if (health <= 0 && gameActive) {
      endGame();
    }
  }, [health, gameActive]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-4 text-blue-400">
        Jason Bourne: Operation Blackbriar
      </h1>

      {/* Game HUD */}
      <div className="flex flex-col md:flex-row justify-between w-full max-w-4xl mb-2 gap-2">
        <div className="flex items-center">
          <Crosshair className="mr-1 text-red-500" size={20} />
          <span className="font-bold text-xl">Score: {score}</span>
        </div>
        <div className="flex items-center">
          <Clock className="mr-1 text-yellow-500" size={20} />
          <span className="font-bold text-xl">Time: {timeLeft}s</span>
        </div>
        <div className="flex items-center">
          <Heart className="mr-1 text-red-500" size={20} />
          <span className="font-bold text-xl">
            Health: {Array(health).fill('❤️').join('')}
          </span>
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        onClick={handleShoot}
        className="relative w-full max-w-4xl h-[50vh] md:h-96 bg-gray-800 rounded-lg border-2 border-blue-500 overflow-hidden cursor-none"
        style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}>
        {gameActive ? (
          <>
            {/* Render targets */}
            {targets.map((target) => (
              <div
                key={target.id}
                className={`absolute rounded-full flex items-center justify-center ${
                  target.dangerous ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{
                  left: `${target.x}px`,
                  top: `${target.y}px`,
                  width: `${target.size}px`,
                  height: `${target.size}px`,
                  transition: 'all 0.1s ease-in-out',
                }}>
                {target.dangerous ? (
                  <X size={target.size * 0.6} className="text-white" />
                ) : (
                  <Target size={target.size * 0.6} className="text-white" />
                )}
              </div>
            ))}

            {/* Dividing line between player area and target area */}
            <div 
              className="absolute w-full h-1 bg-blue-500"
              style={{ 
                bottom: '20%', 
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.7)' 
              }}
            />

            {/* Player base/house */}
            <div 
              className="absolute"
              style={{
                left: `${crosshairPosition.x}px`,
                bottom: '15%',
                transform: 'translateX(-50%)',
              }}>
              {/* Base/house structure */}
              <div className="relative">
                {/* House/base */}
                <div className="w-24 h-16 bg-gray-700 rounded-t-lg border-t-2 border-x-2 border-blue-400"></div>
                
                {/* Player character inside the house */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative w-12 h-12">
                    {/* Main body */}
                    <div className="absolute bottom-0 left-1/2 w-8 h-12 bg-blue-600 rounded-t-lg transform -translate-x-1/2"></div>
                    
                    {/* Cockpit */}
                    <div className="absolute bottom-6 left-1/2 w-6 h-6 bg-blue-300 rounded-full transform -translate-x-1/2"></div>
                    
                    {/* Gun barrel */}
                    <div className="absolute bottom-12 left-1/2 w-2 h-6 bg-gray-700 transform -translate-x-1/2"></div>
                  </div>
                </div>
                
                {/* Opening for the gun */}
                <div className="absolute top-0 left-1/2 w-6 h-4 bg-gray-900 transform -translate-x-1/2 -translate-y-1"></div>
              </div>
            </div>

            {/* Render bullets */}
            {bullets.map(bullet => (
              <div
                key={bullet.id}
                className="absolute bg-yellow-500 rounded-full w-2 h-6"
                style={{
                  left: `${bullet.x}px`,
                  top: `${bullet.y}px`,
                }}
              />
            ))}

            {/* Crosshair */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${crosshairPosition.x}px`,
                top: `${crosshairPosition.y}px`,
                transform: 'translate(-50%, -50%)',
                display: 'block', // Always show on mobile
              }}>
              <Crosshair size={30} className="text-red-500" strokeWidth={1.5} />
            </div>
          </>
        ) : gameOver ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-80">
            <h2 className="text-3xl font-bold mb-4">Mission Complete</h2>
            <p className="text-xl mb-6">Final Score: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-bold transition-colors mb-4">
              Play Again
            </button>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold mb-6">Jason Bourne Shooter</h2>
            <p className="text-lg mb-6 max-w-md text-center">
              Target enemy agents (green) and avoid civilians (red). Missing
              shots and letting enemies escape costs points.
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-bold transition-colors">
              Start Mission
            </button>
          </div>
        )}
      </div>

      {/* Name input for high score */}
      {showNameInput && (
        <div className="mt-4 p-4 bg-gray-800 rounded-md">
          <p className="mb-2">You got a high score! Enter your name:</p>
          <div className="flex">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              maxLength={15}
              placeholder="Enter name"
            />
            <button
              onClick={saveHighScore}
              className="px-4 py-1 bg-green-600 hover:bg-green-700 rounded-r-md font-bold transition-colors">
              Save
            </button>
          </div>
        </div>
      )}

      {/* High Scores */}
      <div className="mt-6 w-full max-w-md">
        <div className="flex items-center mb-2">
          <Trophy className="mr-2 text-yellow-500" size={24} />
          <h2 className="text-2xl font-bold">Leaderboard</h2>
        </div>
        <div className="bg-gray-800 rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-4 py-2 text-left">Rank</th>
                <th className="px-4 py-2 text-left">Agent</th>
                <th className="px-4 py-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {highScores.map((entry, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">{entry.name}</td>
                  <td className="px-4 py-2 text-right">{entry.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Game Instructions */}
      <div className="mt-6 text-gray-400 text-sm max-w-md text-center">
        <p>Click on enemy agents (green targets) to score points.</p>
        <p>Avoid hitting civilians (red X). Missing shots costs 1 point.</p>
        <p>
          If you let an enemy agent escape or hit a civilian, you lose health.
        </p>
      </div>
    </div>
  );
}
