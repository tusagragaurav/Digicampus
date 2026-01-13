import React, { useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

interface JitsiMeetProps {
  roomName: string;
  displayName: string;
  userId: string;
  domain?: string;
  isHost?: boolean;
  onMeetingEnd?: () => void;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
}

export const JitsiMeet: React.FC<JitsiMeetProps> = ({
  roomName,
  displayName,
  userId,
  domain = 'meet.jit.si',
  isHost = false,
  onMeetingEnd,
  onParticipantJoined,
  onParticipantLeft
}) => {
  const apiRef = useRef<any>(null);

  const handleApiReady = (api: any) => {
    apiRef.current = api;

    // Configure meeting settings
    api.executeCommand('displayName', displayName);
    api.executeCommand('subject', roomName);

    // Set user role
    if (isHost) {
      api.executeCommand('setLobbyModeEnabled', true);
    }

    // Event listeners
    api.addEventListener('videoConferenceJoined', () => {
      console.log('Joined meeting:', roomName);
    });

    api.addEventListener('videoConferenceLeft', () => {
      console.log('Left meeting:', roomName);
      onMeetingEnd?.();
    });

    api.addEventListener('participantJoined', (participant: any) => {
      console.log('Participant joined:', participant);
      onParticipantJoined?.(participant);
    });

    api.addEventListener('participantLeft', (participant: any) => {
      console.log('Participant left:', participant);
      onParticipantLeft?.(participant);
    });

    api.addEventListener('readyToClose', () => {
      console.log('Meeting ready to close');
      onMeetingEnd?.();
    });
  };

  const handleReadyToClose = () => {
    console.log('Jitsi meeting ready to close');
    onMeetingEnd?.();
  };

  return (
    <div className="w-full h-full">
      <JitsiMeeting
        domain={domain}
        roomName={roomName}
        userInfo={{
          displayName: displayName,
          email: userId + '@digicampus.edu'
        }}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableModeratorIndicator: false,
          enableEmailInStats: false,
          toolbarButtons: [
            'microphone', 'camera', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat',
            'recording', 'livestreaming', 'etherpad', 'sharedvideo',
            'settings', 'raisehand', 'videoquality', 'filmstrip',
            'feedback', 'stats', 'shortcuts', 'tileview', 'videobackgroundblur',
            'download', 'help', 'mute-everyone', 'security'
          ]
        }}
        interfaceConfigOverwrite={{
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#1f2937',
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat',
            'recording', 'livestreaming', 'etherpad', 'sharedvideo',
            'settings', 'raisehand', 'videoquality', 'filmstrip',
            'feedback', 'stats', 'shortcuts', 'tileview', 'videobackgroundblur',
            'download', 'help', 'mute-everyone', 'security'
          ]
        }}
        onApiReady={handleApiReady}
        onReadyToClose={handleReadyToClose}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%';
          iframeRef.style.width = '100%';
        }}
      />
    </div>
  );
};
