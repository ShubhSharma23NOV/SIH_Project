/**
 * Video Player Screen
 * Plays downloaded training videos offline
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import Video from 'react-native-video';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme';
import Icon from '../components/Icon';
import TrainingService from '../services/TrainingService';

const { width } = Dimensions.get('window');

export default function VideoPlayerScreen({ navigation, route }) {
  const { filePath, module } = route.params;
  const videoRef = useRef(null);
  
  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [completed, setCompleted] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleProgress = (data) => {
    setCurrentTime(data.currentTime);
    
    // Track completion (90% watched)
    if (!completed && data.currentTime / duration > 0.9) {
      setCompleted(true);
      TrainingService.trackModuleCompletion(module.id);
    }
  };

  const handleLoad = (data) => {
    setDuration(data.duration);
  };

  const handleEnd = () => {
    setPaused(true);
    if (!completed) {
      TrainingService.trackModuleCompletion(module.id);
      setCompleted(true);
    }
    Alert.alert(
      'Video Completed',
      'You have completed this training module!',
      [
        { text: 'Replay', onPress: () => {
          videoRef.current?.seek(0);
          setPaused(false);
        }},
        { text: 'Close', onPress: () => navigation.goBack() },
      ]
    );
  };

  const handleSeek = (seconds) => {
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
    videoRef.current?.seek(newTime);
  };

  const togglePlaybackRate = () => {
    const rates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };

  const handleError = (error) => {
    console.error('Video error:', error);
    Alert.alert(
      'Playback Error',
      'Unable to play video. The file may be corrupted.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {module.title}
          </Text>
          {module.titleHindi && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {module.titleHindi}
            </Text>
          )}
        </View>
      </View>

      {/* Video Player */}
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={() => setShowControls(!showControls)}
      >
        <Video
          ref={videoRef}
          source={{ uri: `file://${filePath}` }}
          style={styles.video}
          paused={paused}
          rate={playbackRate}
          onProgress={handleProgress}
          onLoad={handleLoad}
          onEnd={handleEnd}
          onError={handleError}
          resizeMode="contain"
          progressUpdateInterval={1000}
        />

        {/* Play/Pause Overlay */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => setPaused(!paused)}
            >
              <Icon
                name={paused ? 'play' : 'pause'}
                size={64}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>

      {/* Controls */}
      {showControls && (
        <View style={styles.controls}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentTime / duration) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handleSeek(-10)}
            >
              <Icon name="rewind" size={24} color={COLORS.white} />
              <Text style={styles.controlButtonText}>-10s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.playPauseButton]}
              onPress={() => setPaused(!paused)}
            >
              <Icon
                name={paused ? 'play' : 'pause'}
                size={32}
                color={COLORS.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handleSeek(10)}
            >
              <Icon name="forward" size={24} color={COLORS.white} />
              <Text style={styles.controlButtonText}>+10s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={togglePlaybackRate}
            >
              <Text style={styles.playbackRateText}>{playbackRate}x</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Module Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>About this module</Text>
        {module.description && (
          <Text style={styles.infoDescription}>{module.description}</Text>
        )}
        {module.descriptionHindi && (
          <Text style={styles.infoDescriptionHindi}>
            {module.descriptionHindi}
          </Text>
        )}
        <View style={styles.infoMeta}>
          {module.category && (
            <View style={styles.infoMetaItem}>
              <Icon name="tag" size={14} color={COLORS.textLight} />
              <Text style={styles.infoMetaText}>{module.category}</Text>
            </View>
          )}
          {module.difficulty && (
            <View style={styles.infoMetaItem}>
              <Icon name="star" size={14} color={COLORS.textLight} />
              <Text style={styles.infoMetaText}>{module.difficulty}</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  videoContainer: {
    width: width,
    height: width * (9 / 16),
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  timeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontFamily: 'monospace',
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginHorizontal: SPACING.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  playPauseButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  controlButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    marginTop: 4,
  },
  playbackRateText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  infoContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  infoDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  infoDescriptionHindi: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  infoMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  infoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoMetaText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    textTransform: 'capitalize',
  },
});
