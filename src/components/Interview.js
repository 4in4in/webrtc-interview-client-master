class Interview extends HTMLElement {
  connectedCallback() {
    console.log('Interview component created');

    const template = document.getElementById('interview_template');
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.append(template.content.cloneNode(true));

    this.dataChannel = null;

    this.createElements();

    this.setupTextField();

    this.setAttribute('status', 'prepare');

    this.peerConnection = this.createInterviewConnection();
    this.remoteId = this.getAttribute('connection');

    this.prepare();
  }

  static get observedAttributes() {
    return ['status'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'status') {
      this.setControls(newValue);
    }
  }

  async handleStartInterview() {
    this.openInterviewConnection();
  }

  async handleStopInterview() {
    this.setAttribute('status', 'ready');
  }

  async prepare() {
    await this.setLocalView();
    this.setRemoteView();
    this.setAttribute('status', 'ready');
  }

  sendTextMsg(msg) {
    // console.log(msg);
    if(msg !== null && msg != '') {
      this.dataChannel.send(msg);
    }
    else {
      this.dataChannel.send(' ');
    }
    document.getElementById('textInput').style.color="#006600";
  }

  createInterviewConnection() {
    const configuration = { iceServers: Interview.iceServers };
    const peerConnection = new RTCPeerConnection(configuration);

    var dataChannel = peerConnection.createDataChannel("chat", { negotiated: true, id: 0 });

    dataChannel.onmessage = function(event) {
      document.getElementById('textInput').value = event.data;
      document.getElementById('textInput').style.color="#990000";
    }

    this.dataChannel = dataChannel;

    Interview.connection.on('webrtc-message', async (message) => {
      if (message.answer) this.handleRemoteAnswer(message.answer);
      if (message.offer) this.handleRemoteOffer(message.offer);
      if (message.iceCandidate) this.handleICECandidate(message.iceCandidate);
    });

    peerConnection.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        Interview.connection.emit('webrtc-request', {
          id: this.remoteId,
          iceCandidate: event.candidate,
        });
      }
    });

    // peerConnection.addEventListener('onnegotiationneeded', async (event) => {
    //   await peerConnection.setLocalDescription();
    //   Interview.connection.emit('webrtc-request', {
    //     id: this.remoteId,
    //     offer: peerConnection.localDescription,
    //   });
    // });

    peerConnection.addEventListener('connectionstatechange', (event) => {
      if (peerConnection.connectionState === 'connected') {
        console.log('Peers connected!');
      }
    });

    peerConnection.addEventListener('track', (event) => {
      console.log('Add remote track', event.track);
      this.remoteStream.addTrack(event.track, this.remoteStream);
    });

    return peerConnection;
  }

  async setLocalView() {
    const localViewElement = this.shadowRoot.getElementById('local_view');
    const constraints = { video: true, audio: true };
    const localStream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('Got MediaStream:', localStream);
    localViewElement.srcObject = localStream;
    this.localStream = localStream;
  }

  async clearLocalView() {
    const localViewElement = this.shadowRoot.getElementById('local_view');
    localViewElement.srcObject = null;
    this.localStream.getTracks().forEach(function (track) {
      track.stop();
    });
    this.localStream = null;
  }

  setRemoteView() {
    const remoteViewElement = this.shadowRoot.getElementById('remote_view');
    const remoteStream = new MediaStream();
    console.log('Create MediaStream:', remoteStream);
    remoteViewElement.srcObject = remoteStream;
    this.remoteStream = remoteStream;
  }

  clearRemoteView() {
    const remoteViewElement = this.shadowRoot.getElementById('local_view');
    remoteViewElement.srcObject = null;
    this.remoteStream.getTracks().forEach(function (track) {
      track.stop();
    });
    this.remoteStream = null;
  }

  async openInterviewConnection() {
    // await this.setLocalView();
    this.setAttribute('status', 'working');
    this.localStream
      .getTracks()
      .forEach((track) => this.peerConnection.addTrack(track));
    const offer = await this.createConnectionOffer();
    Interview.connection.emit('webrtc-request', {
      id: this.remoteId,
      offer: offer,
    });
  }

  async handleRemoteOffer(offer) {
    // await this.setLocalView();
    this.setAttribute('status', 'working');
    this.localStream
      .getTracks()
      .forEach((track) => this.peerConnection.addTrack(track));
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.createConnectionAnswer();
    console.log('Handle offer');
    Interview.connection.emit('webrtc-request', {
      id: this.remoteId,
      answer: answer,
    });
  }

  async handleRemoteAnswer(answer) {
    const remoteDesc = new RTCSessionDescription(answer);
    await this.peerConnection.setRemoteDescription(remoteDesc);
    console.log('Handle answer');
  }

  async handleICECandidate(iceCandidate) {
    try {
      await this.peerConnection.addIceCandidate(iceCandidate);
      console.log('Handle ICE Candidate');
    } catch (e) {
      console.error('Error adding received ice candidate', e);
    }
  }

  async createConnectionOffer() {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createConnectionAnswer() {
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  setControls(status) {
    const controls = this.shadowRoot.getElementById('controls');
    controls.firstChild && controls.removeChild(controls.firstChild);
    controls.appendChild(
      status === 'working'
        ? this.stopInterviewButton
        : this.startInterviewButton
    );
    if (status === 'prepare') {
      this.startInterviewButton.setAttribute('disabled', true);
    }
    if (status === 'ready') {
      this.startInterviewButton.removeAttribute('disabled');
    }
  }

  createElements() {
    this.startInterviewButton = document.createElement('button');
    this.startInterviewButton.innerText = 'Начать собеседование';
    this.startInterviewButton.onclick = () => this.handleStartInterview();

    this.stopInterviewButton = document.createElement('button');
    this.stopInterviewButton.innerText = 'Завершить собеседование';
    this.stopInterviewButton.onclick = () => this.handleStopInterview();
  }

  setupTextField() {
    this.textInput = document.getElementById('textInput');
    this.textInput.hidden = false;
    this.textInput.input = () => this.sendTextMsg(this.textInput.value);
    this.textInput.onkeyup = () => this.sendTextMsg(this.textInput.value);

    this.textInput.addEventListener('keydown', function(e) {
      if (e.key == 'Tab') {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;

        var tabulation = '    '
    
        // set textarea value to: text before caret + tab + text after caret
        this.value = this.value.substring(0, start) +
          tabulation + this.value.substring(end);
    
        // put caret at right position again
        this.selectionStart =
          this.selectionEnd = start + tabulation.length()-1;
      }
    });
  }
}

export default Interview;
