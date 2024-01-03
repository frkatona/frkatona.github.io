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
    '7': np.array([10]),
    '9': np.array([10, 14]),
    '11': np.array([10, 14, 17]),
    '13': np.array( [10, 14, 17, 21])
}

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

MIDI_C = 60

def MakeChord(chord_name):
    '''take chord name and use it to output chord interval array'''

    numeral_list = chord_name.split('_')
    prior_extension = False
    slash = 0

    ## (1) START WITH ROOT NOTES & CHECK FOR/APPLY FLAT ##
    if numeral_list[0][0] == 'b':
        chord = base_chords[numeral_list[0][1:].upper()] - 1
    else:
        chord = base_chords[numeral_list[0].upper()]

    ## (2) CHECK FOR/APPLY MINOR ##
    if numeral_list[0][1:].lower() == numeral_list[0][1:]:
        chord[1] -= 1

    ## (3) CHECK FOR EXTENSIONS/ADDS AND ALTERATIONS/SUSPENSIONS ##
    for i in numeral_list[1:]:
        for j in extensions:
            if i[-1] == j[-1]: 

                # if no departures, append unaltered extension list
                if i.lower() == j.lower(): 
                    chord = np.append(chord, chord[0]+extensions[j])
                    prior_extension = True

                ## assess for adds and maj modifiers
                if i.lower()[0:3] == 'add':
                    chord = np.append(chord, chord[0]+extensions[j][-1]) # append last item in extension entry list
                elif i.lower()[0:3] == 'maj':
                    major_extension = extensions[j]
                    major_extension[0] = 11
                    chord = np.append(chord, (chord[0] + major_extension))
                    prior_extension = True

                
                ## if there is an additional first character, assess for sharpened/flatted extension
                if i[1:] == j: 
                    if i[0] == '#':
                        alteration = 1
                    else:
                        alteration = -1
                    if prior_extension == False:
                        altered_extension = np.append(extensions[j][:-1], (extensions[j][-1] + alteration))
                    else:
                        altered_extension = extensions[j][-1] + alteration
                    chord = np.append(chord, (altered_extension))

        ## assess for sus and altered 5 modifiers
        if i.lower()[0:4] == 'sus2':
            chord[1] = chord[0] + 2
        elif i.lower()[0:3] == 'sus':
            chord[1] = chord[0] + 5
        elif i[-1] == '5':
            if i[0] == '#':
                chord[2] += 1
            elif i[0] == 'b':
                chord[2] -=1

        ## (4) CHECK FOR SLASHES ##
        if i[0] == '/':
            slash = i[1:]
    
    return(chord, slash) #slash


def ModifyVoicing (chord, slash, min_interval):
    '''transpose notes to change voicing'''
    i = 1
    while i < len(chord):
        interval = (chord[i] - chord[i-1])
        if chord[i] == int(slash):
            chord[i] -= 12
        if interval < min_interval:
            chord[i] -= 12
            for j in chord:
                if j < chord[i]:
                    chord[i] -= 12
        i += 1

    return(chord)

def Relative_to_MIDI(note, key):
    '''take relative-interval note and convert to MIDI note in given key'''
    midi_note = note + MIDI_C + key_adjustment[key]
    midi_command = noteOn(midi_note, duration), noteOff(midi_note, duration)


key = 'C'
min_interval = 5
test_chord = 'I_7_#9_/10'

chord, slash = MakeChord(test_chord)
modified_chord = ModifyVoicing(chord, slash, min_interval)

print(chord, slash)
print(modified_chord)