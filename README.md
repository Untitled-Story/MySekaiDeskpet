# My Sekai Deskpet

A deskpet for Project SEKAI chibi model

## Usage

Download your model using the following structure:

```
Running Directory
| - model
| | - config.json
| | - model.json # The skeleton file in json
| | - sekai_atlas.atlas
| | - sekai_atlas.png
```

The structure of Config is as follows:

```json
{
  "idle": "v2_w_happy_idle01_f",
  "frequencyMin": 10,
  "frequencyMax": 15,
  "randoms": [
    "v2_m_cool_surprise01_f",
    "v2_m_happy_doubt01_f",
    "v2_m_happy_joy01_f",
    "v2_m_happy_laugh01_f",
    "v2_m_pure_joy01_f"
  ],
  "enableWalk": true,
  "walkProbability": 0.1,
  "walkAnim": "v2_m_normal_walk01_f",
  "enablePhysics": false,
  "physicsSpeed": 5,
  "G": 9.8,
  "airResistance": 0.9,
  "footHeight": 25,
  "dropEndAnim": "v2_w_pure_angry01_f"
}
```

## Configuration Explanation

Here's the explanation for each configuration parameter:

- **idle**: The animation to play when the character is idle.
- **frequencyMin**: Minimum interval in seconds between random actions.
- **frequencyMax**: Maximum interval in seconds between random actions.
- **randoms**: List of animations that can be played randomly.
- **enableWalk**: Whether to enable the character to walk randomly.
- **walkProbability**: Probability of the character choosing to walk when performing a random action.
- **walkAnim**: The animation to play when the character is walking.
- **enablePhysics**: Whether to enable physics simulation for the character.
- **physicsSpeed**: Speed multiplier for physics calculations.
- **G**: Gravitational acceleration value.
- **airResistance**: Air resistance coefficient affecting velocity decay.
- **footHeight**: Height offset for the character's feet, used in collision detection.
- **dropEndAnim**: The animation to play when the character lands after being dropped.
