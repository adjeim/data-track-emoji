const video = document.getElementById('video');
const gallery = document.getElementById('gallery');
const identityInput = document.getElementById('identity');

// buttons
const joinRoomButton = document.getElementById('button-join');
const leaveRoomButton = document.getElementById('button-leave');
const heartButton = document.getElementById('heart');
const smileButton = document.getElementById('smile');
const fireButton = document.getElementById('fire');
const partyButton = document.getElementById('party');

// confetti
const confettiCanvas = document.getElementById('confetti');
const jsConfetti = new JSConfetti({canvas: confettiCanvas});

// local data track
const localDataTrack = new Twilio.Video.LocalDataTrack();

const ROOM_NAME = 'emoji-party';
let videoRoom;

const addLocalVideo = async () =>  {
  const videoTrack = await Twilio.Video.createLocalVideoTrack();
  const localVideoDiv = document.createElement('div');
  localVideoDiv.setAttribute('id', 'localParticipant');

  const trackElement = videoTrack.attach();
  localVideoDiv.appendChild(trackElement);

  gallery.appendChild(localVideoDiv);
};

const joinRoom = async (event) => {
  event.preventDefault();

  const identity = identityInput.value;

  try {
    const response = await fetch('/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'identity': identity,
        'room': ROOM_NAME
      })
    });

    const data = await response.json();

    // Creates the audio and video tracks
    const localTracks = await Twilio.Video.createLocalTracks();

    // Include the data track
    const tracks = [...localTracks, localDataTrack];

    videoRoom = await Twilio.Video.connect(data.token, {
      name: ROOM_NAME,
      tracks: tracks
    });

    console.log(`You are now connected to Room ${videoRoom.name}`);

    const localParticipant = document.getElementById('localParticipant');
    const identityDiv = document.createElement('div');
    identityDiv.setAttribute('class', 'identity');
    identityDiv.innerHTML = identity;
    localParticipant.appendChild(identityDiv);

    videoRoom.participants.forEach(participantConnected);
    videoRoom.on('participantConnected', participantConnected);
    videoRoom.on('participantDisconnected', participantDisconnected);

    joinRoomButton.disabled = true;
    leaveRoomButton.disabled = false;
    identityInput.disabled = true;
  } catch (error) {
    console.log(error);
  }
}

const leaveRoom = (event) => {
  event.preventDefault();
  videoRoom.disconnect();
  console.log(`You are now disconnected from Room ${videoRoom.name}`);

  let removeParticipants = gallery.getElementsByClassName('participant');

  while (removeParticipants[0]) {
    gallery.removeChild(removeParticipants[0]);
  }

  localParticipant.removeChild(localParticipant.lastElementChild);

  joinRoomButton.disabled = false;
  leaveRoomButton.disabled = true;
  identityInput.disabled = false;
}

const launchConfetti = (selectedEmoji, participant = null) => {
  switch (selectedEmoji) {
    case 'heart emoji':
      jsConfetti.addConfetti({
        emojis: ['❤️'],
        emojiSize: 50,
        confettiNumber: 30,
        confettiRadius: 3
      });
      break;
    case 'smile emoji':
      jsConfetti.addConfetti({
        emojis: ['😄'],
        emojiSize: 50,
        confettiNumber: 30,
        confettiRadius: 3
      });
      break;
    case 'fire emoji':
      jsConfetti.addConfetti({
        emojis: ['🔥'],
        emojiSize: 50,
        confettiNumber: 30,
        confettiRadius: 3
      });
      break;
    default:
      jsConfetti.addConfetti({
        emojis: ['⭐', '👍', '✨', '🎉', '🌸'],
        emojiSize: 50,
        confettiNumber: 30,
        confettiRadius: 3
      });
      break;
  }

  // If the person who pressed the button to send the emoji is the local participant,
  // send the emoji to everyone else on the call
  if (participant && participant.id === 'localParticipant') {
    localDataTrack.send(selectedEmoji);
  }
}

const participantConnected = (participant) => {
  console.log(`${participant.identity} has joined the call.`);

  const participantDiv = document.createElement('div');
  participantDiv.setAttribute('id', participant.sid);
  participantDiv.setAttribute('class', 'participant');

  const tracksDiv = document.createElement('div');
  participantDiv.appendChild(tracksDiv);

  const identityDiv = document.createElement('div');
  identityDiv.setAttribute('class', 'identity');
  identityDiv.innerHTML = participant.identity;
  participantDiv.appendChild(identityDiv);

  gallery.appendChild(participantDiv);

  participant.tracks.forEach(publication => {
    if (publication.isSubscribed) {
      tracksDiv.appendChild(publication.track.attach());
    }
  });

  participant.on('trackSubscribed', track => {
    // Attach the video and audio tracks to the DOM
    if (track.kind === 'video' || track.kind === 'audio') {
      tracksDiv.appendChild(track.attach());
    }

    // Set up a listener for the data track
    if (track.kind === 'data') {
      // When a message is received via the data track, launch emoji confetti!
      track.on('message', emoji => {
        launchConfetti(emoji, null)
      });
    }
  });

  participant.on('trackUnsubscribed', track => {
    // Remove audio and video elements from the DOM
    if (track.kind === 'audio' || track.kind === 'video') {
      track.detach().forEach(element => element.remove());
    }
  });
};

const participantDisconnected = (participant) => {
  console.log(`${participant.identity} has left the call.`);
  document.getElementById(participant.sid).remove();
};

// Show the participant a preview of their video
addLocalVideo();

// Event listeners
joinRoomButton.addEventListener('click', joinRoom);
leaveRoomButton.addEventListener('click', leaveRoom);

heartButton.addEventListener('click', (event) => { launchConfetti(event.target.ariaLabel, localParticipant) });
smileButton.addEventListener('click', (event) => { launchConfetti(event.target.ariaLabel, localParticipant) });
fireButton.addEventListener('click', (event) => { launchConfetti(event.target.ariaLabel, localParticipant) });
partyButton.addEventListener('click', (event) => { launchConfetti(event.target.ariaLabel, localParticipant) });