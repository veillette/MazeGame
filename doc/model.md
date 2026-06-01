# Maze Game — Model Description

## Overview

Maze Game is a kinematics exploration where students drive a particle through a tile-based maze. The learning goal is to connect **position**, **velocity**, and **acceleration** as different ways to control motion, and to see how collisions affect the ability to reach the goal.

## The Particle

The player controls a circular particle on a 32 × 14 tile grid (each tile is 1 meter). The particle has:

- **Position** — where it is on the maze (meters, origin at grid center)
- **Velocity** — speed and direction (m/s), used in Velocity mode
- **Acceleration** — rate of change of velocity (m/s²), used in Acceleration mode

In **Position** mode, velocity and acceleration are not integrated; the user sets position directly. In **Velocity** mode, the sim integrates position from velocity each timestep. In **Acceleration** mode, the sim integrates velocity and position from acceleration.

## The Maze

Each level is an ASCII grid of tiles:

| Tile | Meaning |
|------|---------|
| Open floor | Particle can pass |
| Wall | Particle collides; velocity/acceleration reset on contact |
| Start | Initial spawn point |
| Finish | Goal tile |

When the particle overlaps a wall in Velocity or Acceleration mode, the sim pushes it back to the last non-colliding point and zeros velocity (and acceleration in Acceleration mode). This prevents tunneling through walls.

## Collisions and Winning

- Each **new** wall contact increments the collision counter (staying in contact does not add more).
- The player **wins** only when the particle touches the finish tile **with zero collisions** on that attempt.
- After a collision, the finish tile appears “closed” until the level is reset.

## Timer

The elapsed-time counter starts when the particle moves off the start tile, so setup time is not counted.

## Levels

Four levels are provided, from Practice (open path) to Certain Death (narrow passages). Difficulty increases with wall density and path complexity.

## Control Modes (Pedagogy)

| Mode | Student action | Model behavior |
|------|----------------|----------------|
| Position | Drag particle or pad; arrow keys step position | Direct position set |
| Velocity | Set velocity vector on pad; arrow keys set speed/direction | Position integrated from v |
| Acceleration | Set acceleration vector; arrow keys set a | v and x integrated from a |

Switching modes clears unused vectors (e.g. switching to Position zeros velocity and acceleration).
