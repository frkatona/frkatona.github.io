import json

def replace_special_characters(data):
    if isinstance(data, dict):
        return {key: replace_special_characters(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [replace_special_characters(element) for element in data]
    elif isinstance(data, str):
        return data.replace('\u00e2\u20ac\u2122', "'")
    else:
        return data

# Load the JSON object into a Python dictionary
json_data = {
  "title": "Push You Away",
  "key": "G (C, Capo 7)",
  "sections": [
    {
      "name": "Verse 1",
      "lines": [
        [
          {
            "word": "A tiger\u00e2\u20ac\u2122s not to blame",
            "chord": "C"
          }
        ],
        [
          {
            "word": "When there\u00e2\u20ac\u2122s no change in his stripes",
            "chord": "F"
          },
          {
            "word": "",
            "chord": "Fsus2"
          }
        ],
        [
          {
            "word": "Tortoise can\u00e2\u20ac\u2122t complain",
            "chord": "C"
          }
        ],
        [
          {
            "word": "About a scorpion bite",
            "chord": "F"
          },
          {
            "word": "",
            "chord": "Fsus2"
          }
        ],
        [
          {
            "word": "I betrayed all the",
            "chord": "Am"
          },
          {
            "word": "promises I made",
            "chord": "G"
          }
        ],
        [
          {
            "word": "shouldn\u00e2\u20ac\u2122t come as much of a",
            "chord": "F"
          },
          {
            "word": "surprise",
            "chord": "G"
          }
        ],
        [
          {
            "word": "Some people just aren\u00e2\u20ac\u2122t",
            "chord": "Am"
          },
          {
            "word": "made to have a happy",
            "chord": "G"
          },
          {
            "word": "life",
            "chord": "F"
          },
          {
            "word": "",
            "chord": "G"
          }
        ]
      ]
    },
    {
      "name": "Chorus 1",
      "lines": [
        [
          {
            "word": "lovely",
            "chord": "C"
          },
          {
            "word": "",
            "chord": "F"
          }
        ],
        [
          {
            "word": "",
            "chord": "Am"
          },
          {
            "word": "loved me",
            "chord": "F"
          }
        ],
        [
          {
            "word": "ugly",
            "chord": "C"
          },
          {
            "word": "",
            "chord": "F"
          }
        ],
        [
          {
            "word": "me that you just",
            "chord": "Am"
          },
          {
            "word": "wouldn\u00e2\u20ac\u2122t see",
            "chord": "F"
          }
        ],
        [
          {
            "word": "pushed you away",
            "chord": "C"
          }
        ],
        [
          {
            "word": "away and away and",
            "chord": "G"
          },
          {
            "word": "away and",
            "chord": "F"
          },
          {
            "word": "away",
            "chord": "Dm"
          }
        ],
        [
          {
            "word": "held you at arm\u00e2\u20ac\u2122s length",
            "chord": "C"
          }
        ],
        [
          {
            "word": "away and",
            "chord": "G"
          },
          {
            "word": "away and",
            "chord": "F"
          },
          {
            "word": "away",
            "chord": "Dm"
          }
        ],
        [
          {
            "word": "I kept you safe",
            "chord": "C"
          }
        ]
      ]
    },
    {
      "name": "Verse 2",
      "lines": [
        [
          {
            "word": "Some molds don\u00e2\u20ac\u2122t break",
            "chord": "C"
          }
        ],
        [
          {
            "word": "I\u00e2\u20ac\u2122ve stayed true to type",
            "chord": "F"
          },
          {
            "word": "",
            "chord": "Fsus2"
          }
        ],
        [
          {
            "word": "Baby I ain\u00e2\u20ac\u2122t trying to claim",
            "chord": "C"
          }
        ],
        [
          {
            "word": "That what I did was right",
            "chord": "F"
          },
          {
            "word": "",
            "chord": "Fsus2"
          }
        ],
        [
          {
            "word": "I betrayed all the",
            "chord": "Am"
          },
          {
            "word": "promises we made",
            "chord": "G"
          }
        ],
        [
          {
            "word": "hope you know it wasn\u00e2\u20ac\u2122t out of",
            "chord": "F"
          },
          {
            "word": "spite",
            "chord": "G"
          }
        ],
        [
          {
            "word": "Some people just aren\u00e2\u20ac\u2122t",
            "chord": "Am"
          },
          {
            "word": "made to have a happy",
            "chord": "G"
          },
          {
            "word": "life",
            "chord": "F"
          },
          {
            "word": "",
            "chord": "G"
          }
        ]
      ]
    },
    {
      "name": "Chorus 2",
      "lines": [
        [
          {
            "word": "lovely",
            "chord": "C"
          },
          {
            "word": "",
            "chord": "F"
          }
        ],
        [
          {
            "word": "",
            "chord": "Am"
          },
          {
            "word": "loved me",
            "chord": "F"
          }
        ],
        [
          {
            "word": "ugly",
            "chord": "C"
          },
          {
            "word": "",
            "chord": "F"
          }
        ],
        [
          {
            "word": "me that you just",
            "chord": "Am"
          },
          {
            "word": "wouldn\u00e2\u20ac\u2122t see",
            "chord": "F"
          }
        ],
        [
          {
            "word": "pushed you away",
            "chord": "C"
          }
        ],
        [
          {
            "word": "away and away and",
            "chord": "G"
          },
          {
            "word": "away and",
            "chord": "F"
          },
          {
            "word": "away",
            "chord": "Dm"
          }
        ],
        [
          {
            "word": "held you at arm\u00e2\u20ac\u2122s length",
            "chord": "C"
          }
        ],
        [
          {
            "word": "away and",
            "chord": "G"
          },
          {
            "word": "away and",
            "chord": "F"
          },
          {
            "word": "away",
            "chord": "Dm"
          }
        ],
        [
          {
            "word": "I kept you safe",
            "chord": "C"
          }
        ]
      ]
    },
    {
      "name": "Chorus 2",
      "lines": [
        [],
        [
          {
            "word": "And when I be",
            "chord": "Am"
          },
          {
            "word": "trayed",
            "chord": "G"
          },
          {
            "word": "every single promise that I",
            "chord": "F"
          },
          {
            "word": "made",
            "chord": "G"
          }
        ],
        [],
        [
          {
            "word": "Baby I\u00e2\u20ac\u2122m just not",
            "chord": "Am"
          },
          {
            "word": "made",
            "chord": "G"
          },
          {
            "word": "to have a happy life",
            "chord": "F"
          },
          {
            "word": "",
            "chord": "G"
          }
        ]
      ]
    },
    {
      "name": "Chorus 3",
      "lines": [
        [
          {
            "word": "lovely",
            "chord": "C"
          },
          {
            "word": "",
            "chord": "F"
          }
        ],
        [
          {
            "word": "",
            "chord": "Am"
          },
          {
            "word": "loved me",
            "chord": "F"
          }
        ],
        [
          {
            "word": "ugly",
            "chord": "C"
          },
          {
            "word": "",
            "chord": "F"
          }
        ],
        [
          {
            "word": "me that you just",
            "chord": "Am"
          },
          {
            "word": "wouldn\u00e2\u20ac\u2122t see",
            "chord": "F"
          }
        ],
        [
          {
            "word": "pushed you away",
            "chord": "C"
          }
        ],
        [
          {
            "word": "away and away and",
            "chord": "G"
          },
          {
            "word": "away and",
            "chord": "F"
          },
          {
            "word": "away",
            "chord": "Dm"
          }
        ],
        [
          {
            "word": "held you at arm\u00e2\u20ac\u2122s length",
            "chord": "C"
          }
        ],
        [
          {
            "word": "away and",
            "chord": "G"
          },
          {
            "word": "away and",
            "chord": "F"
          },
          {
            "word": "away",
            "chord": "Dm"
          }
        ],
        [
          {
            "word": "I kept you safe",
            "chord": "C"
          }
        ]
      ]
    },
    {
      "name": "Chorus 3",
      "lines": []
    }
  ]
}

# Apply the function to replace special characters
cleaned_json_data = replace_special_characters(json_data)

# Write the cleaned data to a file
with open('cleaned_json_data.json', 'w', encoding='utf-8') as f:
    json.dump(cleaned_json_data, f, ensure_ascii=False, indent=4)