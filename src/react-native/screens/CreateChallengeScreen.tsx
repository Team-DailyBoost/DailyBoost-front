import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, differenceInDays } from 'date-fns';
import { createChallenge, ChallengeRequest } from '../../api/challenges';
import { Feather as Icon } from '@expo/vector-icons';
import type { ChallengeStackParamList } from '../navigation/types';

type CreateChallengeScreenNavigationProp = NativeStackNavigationProp<
  ChallengeStackParamList,
  'CreateChallenge'
>;

type CreateChallengeScreenRouteProp = RouteProp<
  ChallengeStackParamList,
  'CreateChallenge'
>;

interface ChallengeFormData {
  title: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
}

const TITLE_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 500;

export function CreateChallengeScreen() {
  const navigation = useNavigation<CreateChallengeScreenNavigationProp>();
  const route = useRoute<CreateChallengeScreenRouteProp>();
  
  const [formData, setFormData] = useState<ChallengeFormData>({
    title: '',
    description: '',
    startDate: null,
    endDate: null,
  });
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ChallengeFormData, string>>>({});

  // Navigation params에서 callback 가져오기
  const onChallengeCreated = route.params?.onChallengeCreated;

  // 날짜를 LocalDateTime 형식으로 변환 (yyyy-MM-ddTHH:mm:ss)
  const formatLocalDateTime = (date: Date, isEndDate: boolean): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = isEndDate ? '23' : '00';
    const minutes = isEndDate ? '59' : '00';
    const seconds = isEndDate ? '59' : '00';
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // 입력값 업데이트
  const updateField = <K extends keyof ChallengeFormData>(
    field: K,
    value: ChallengeFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 해당 필드의 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 폼 유효성 검증
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ChallengeFormData, string>> = {};

    // 제목 검증
    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      newErrors.title = '챌린지 제목을 입력해주세요.';
    } else if (trimmedTitle.length > TITLE_MAX_LENGTH) {
      newErrors.title = `제목은 ${TITLE_MAX_LENGTH}자 이하여야 합니다.`;
    }

    // 설명 검증
    const trimmedDescription = formData.description.trim();
    if (!trimmedDescription) {
      newErrors.description = '챌린지 설명을 입력해주세요.';
    } else if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
      newErrors.description = `설명은 ${DESCRIPTION_MAX_LENGTH}자 이하여야 합니다.`;
    }

    // 시작일 검증
    if (!formData.startDate) {
      newErrors.startDate = '시작일을 선택해주세요.';
    }

    // 종료일 검증
    if (!formData.endDate) {
      newErrors.endDate = '종료일을 선택해주세요.';
    } else if (formData.startDate) {
      // 시작일과 종료일 비교
      const startTime = formData.startDate.getTime();
      const endTime = formData.endDate.getTime();
      
      if (endTime <= startTime) {
        newErrors.endDate = '종료일은 시작일보다 늦어야 합니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 챌린지 생성
  const handleCreateChallenge = async () => {
    // 유효성 검증
    if (!validateForm()) {
      Alert.alert('입력 오류', '모든 필드를 올바르게 입력해주세요.');
      return;
    }

    // 이미 생성 중이면 중복 요청 방지
    if (isCreating) {
      return;
    }

    setIsCreating(true);

    try {
      console.log('[CreateChallenge] 챌린지 생성 시도:', formData);
      
      // API 요청 데이터 구성
      const request: ChallengeRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: formatLocalDateTime(formData.startDate!, false),
        endDate: formatLocalDateTime(formData.endDate!, true),
      };
      
      console.log('[CreateChallenge] 챌린지 생성 요청:', JSON.stringify(request, null, 2));
      
      // API 호출
      const response = await createChallenge(request);
      console.log('[CreateChallenge] 챌린지 생성 성공:', response);
      
      // 성공 시 콜백 호출
      if (onChallengeCreated) {
        onChallengeCreated();
      }
      
      // 성공 메시지 표시 후 뒤로가기
      Alert.alert(
        '완료',
        response?.message || '챌린지가 생성되었습니다!',
        [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error('[CreateChallenge] 챌린지 생성 실패:', error);
      
      let errorMessage = '챌린지 생성에 실패했습니다.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // 뒤로가기 처리
  const handleGoBack = () => {
    if (isCreating) {
      Alert.alert(
        '확인',
        '챌린지 생성이 진행 중입니다. 정말 나가시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '나가기', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // 날짜 선택 핸들러
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    
    if (selectedDate) {
      updateField('startDate', selectedDate);
      
      // 종료일이 시작일보다 이전이면 종료일 조정
      if (formData.endDate && selectedDate >= formData.endDate) {
        const newEndDate = new Date(selectedDate);
        newEndDate.setDate(newEndDate.getDate() + 7); // 기본 7일 추가
        updateField('endDate', newEndDate);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    
    if (selectedDate) {
      updateField('endDate', selectedDate);
    }
  };

  // 챌린지 기간 계산
  const challengeDuration = formData.startDate && formData.endDate
    ? differenceInDays(formData.endDate, formData.startDate) + 1
    : null;

  // 폼 완성도 확인 (모든 필수 필드가 입력되었는지)
  const isFormComplete =
    formData.title.trim().length > 0 &&
    formData.description.trim().length > 0 &&
    formData.startDate !== null &&
    formData.endDate !== null;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
          disabled={isCreating}
        >
          <Icon name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerTitleIconContainer}>
            <Icon name="award" size={24} color="#6366f1" />
          </View>
          <Text style={styles.headerTitle}>새 챌린지 만들기</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.subtitle}>
            목표를 달성하기 위한 챌린지를 만들어보세요
          </Text>

          {/* 챌린지 제목 */}
          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Icon name="edit-3" size={16} color="#6366f1" />
              <Text style={styles.label}>
                챌린지 제목 <Text style={styles.requiredMark}>*</Text>
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                formData.title.trim() && styles.inputFilled,
                errors.title && styles.inputError,
              ]}
              placeholder="예: 30일 스쿼트 챌린지"
              placeholderTextColor="#9ca3af"
              value={formData.title}
              onChangeText={(text) => updateField('title', text)}
              maxLength={TITLE_MAX_LENGTH}
              editable={!isCreating}
            />
            <View style={styles.helperContainer}>
              {errors.title ? (
                <Text style={styles.errorText}>{errors.title}</Text>
              ) : (
                formData.title.trim() && (
                  <Text style={styles.helperText}>
                    {formData.title.length}/{TITLE_MAX_LENGTH}
                  </Text>
                )
              )}
            </View>
          </View>

          {/* 챌린지 설명 */}
          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Icon name="file-text" size={16} color="#6366f1" />
              <Text style={styles.label}>
                챌린지 설명 <Text style={styles.requiredMark}>*</Text>
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                formData.description.trim() && styles.inputFilled,
                errors.description && styles.inputError,
              ]}
              placeholder="챌린지에 대한 설명을 입력하세요&#10;예: 매일 스쿼트 100개씩 실천하는 30일 챌린지입니다"
              placeholderTextColor="#9ca3af"
              value={formData.description}
              onChangeText={(text) => updateField('description', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={DESCRIPTION_MAX_LENGTH}
              editable={!isCreating}
            />
            <View style={styles.helperContainer}>
              {errors.description ? (
                <Text style={styles.errorText}>{errors.description}</Text>
              ) : (
                formData.description.trim() && (
                  <Text style={styles.helperText}>
                    {formData.description.length}/{DESCRIPTION_MAX_LENGTH}
                  </Text>
                )
              )}
            </View>
          </View>

          {/* 챌린지 기간 */}
          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Icon name="calendar" size={16} color="#6366f1" />
              <Text style={styles.label}>
                챌린지 기간 <Text style={styles.requiredMark}>*</Text>
              </Text>
            </View>
            
            <View style={styles.datePickerContainer}>
              {/* 시작일 */}
              <View style={styles.datePickerItem}>
                <Text style={styles.dateLabel}>시작일</Text>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    formData.startDate && styles.datePickerButtonSelected,
                    errors.startDate && styles.datePickerButtonError,
                  ]}
                  onPress={() => !isCreating && setShowStartDatePicker(true)}
                  activeOpacity={0.7}
                  disabled={isCreating}
                >
                  <Icon name="calendar" size={18} color={formData.startDate ? "#6366f1" : "#9ca3af"} />
                  <Text
                    style={[
                      styles.datePickerButtonText,
                      !formData.startDate && styles.datePickerButtonTextPlaceholder,
                    ]}
                  >
                    {formData.startDate
                      ? format(formData.startDate, 'yyyy-MM-dd')
                      : '날짜 선택'}
                  </Text>
                </TouchableOpacity>
                {errors.startDate && (
                  <Text style={styles.dateErrorText}>{errors.startDate}</Text>
                )}
              </View>

              {/* 화살표 */}
              <View style={styles.dateArrow}>
                <Text style={styles.dateArrowText}>→</Text>
              </View>

              {/* 종료일 */}
              <View style={styles.datePickerItem}>
                <Text style={styles.dateLabel}>종료일</Text>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    formData.endDate && styles.datePickerButtonSelected,
                    errors.endDate && styles.datePickerButtonError,
                  ]}
                  onPress={() => !isCreating && setShowEndDatePicker(true)}
                  activeOpacity={0.7}
                  disabled={isCreating || !formData.startDate}
                >
                  <Icon name="calendar" size={18} color={formData.endDate ? "#6366f1" : "#9ca3af"} />
                  <Text
                    style={[
                      styles.datePickerButtonText,
                      !formData.endDate && styles.datePickerButtonTextPlaceholder,
                    ]}
                  >
                    {formData.endDate
                      ? format(formData.endDate, 'yyyy-MM-dd')
                      : '날짜 선택'}
                  </Text>
                </TouchableOpacity>
                {errors.endDate && (
                  <Text style={styles.dateErrorText}>{errors.endDate}</Text>
                )}
              </View>
            </View>

            {/* 기간 정보 */}
            {challengeDuration !== null && challengeDuration > 0 && (
              <View style={styles.dateInfoBox}>
                <View style={styles.dateInfoRow}>
                  <Icon name="bar-chart-2" size={16} color="#4338ca" />
                  <Text style={styles.dateInfoText}>
                    총 {challengeDuration}일간 진행됩니다
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
          disabled={isCreating}
        >
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!isFormComplete || isCreating) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateChallenge}
          disabled={!isFormComplete || isCreating}
          activeOpacity={0.8}
        >
          {isCreating ? (
            <>
              <ActivityIndicator
                size="small"
                color="#ffffff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.createButtonText}>생성 중...</Text>
            </>
          ) : (
              <>
                <Icon name="check-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.createButtonText}>생성하기</Text>
              </>
          )}
        </TouchableOpacity>
      </View>

      {/* 날짜 선택기 */}
      {showStartDatePicker && (
        <DateTimePicker
          value={formData.startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={formData.endDate || formData.startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
          minimumDate={formData.startDate || new Date()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 0,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // footer 공간
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '400',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  requiredMark: {
    color: '#ef4444',
    fontSize: 14,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputFilled: {
    borderColor: '#6366f1',
    backgroundColor: '#f8f9ff',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  helperContainer: {
    marginTop: 6,
    minHeight: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  datePickerItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  datePickerButton: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#ffffff',
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  datePickerButtonSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  datePickerButtonError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  datePickerButtonText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  datePickerButtonTextPlaceholder: {
    color: '#9ca3af',
    fontWeight: '400',
  },
  dateArrow: {
    paddingBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateArrowText: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '600',
  },
  dateErrorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
  },
  dateInfoBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  dateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInfoText: {
    fontSize: 13,
    color: '#4338ca',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
