import numpy as np

base_progression = {
    'basic':
    {
        'axis':['I','V','vi','IV'],
        'taylor':['I','IV','V','I'],
        'six':['I','vi','ii','V'],
        'jazz':['ii','V', 'I', 'iv']
    },

    'modeMixed':
    {
        'yes':['I','bVII','IV','IV'],
        'house':['vi','I','II','IV'],
        'hotel':['vi','III','IV']
    }
}

base_chords = {
    'I':np.array([0,4,7]),
    'II':np.array([2,6,9]),
    'III':np.array([4,8,11]),
    'IV':np.array([5,9,12]),
    'V':np.array([7,11,14]),
    'VI':np.array([9,13,16]),
    'VII':np.array([11,15,18]),
}

extensions = {
    'min7': 10,
    'dom7': 10,
    '7': 10,
    'maj7': 11,
}

MIDI_C = 60

key_adjustment = {
    'C':0,
    'C#':1,
    'D':2,
    'D#':3,
    'E':4,
    'F':5,
    'F#':6,
    'G':7,
    'G#':8,
    'A':9,
    'A#':10,
    'B':11
}

test_chord = 'bIII_maj7_b5'
numeral_list = test_chord.split('_') #input('enter chord: ').split('_')

## check for (1) flatted, (2) root/quality, (3) extensions/adds, (4) alterations/suspensions, (5) slashes(bass note)

## (1) START WITH ROOT NOTES & CHECK FOR/APPLY FLAT ##
if numeral_list[0][0] == 'b':
    chord = base_chords[numeral_list[0][1:].upper()] - 1
else:
    chord = base_chords[numeral_list[0]]

## (2) CHECK FOR/APPLY MINOR ##
if numeral_list[0].lower() != numeral_list[0][1:]:
    chord[1] -= 1

## (3) CHECK FOR EXTENSIONS/ADDS AND ALTERATIONS/SUSPENSIONS ##
for i in numeral_list[1:]:
    for j in extensions:
        if i.lower() == j.lower:
            chord.append(extensions[j])
            break
    if i.lower()[0:3] == 'sus2':
        chord[1] = chord[0] + 2
    elif i.lower()[0:2] == 'sus':
        chord[1] = chord[0] + 5
    elif i.lower()[0:2] == 'add':
        


print(chord)

## (4) CHECK FOR SLASHES ##


key = 'C'

def basenote_to_MIDInote(note, key):
    midi_note = note + MIDI_C + key_adjustment[key]
    # midi_command = noteOn(midi_note, duration), noteOff(midi_note, duration)