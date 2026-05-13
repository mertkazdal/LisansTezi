/// Image picker and encoder service for gallery/camera analysis inputs.
library;

import 'dart:convert';
import 'dart:typed_data';

import 'package:image_picker/image_picker.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/network/api_exception.dart';
import '../domain/analysis_models.dart';

class ImageInputService {
  ImageInputService(this._imagePicker);

  final ImagePicker _imagePicker;

  Future<AnalysisImageInput?> pickFromGallery() {
    return _pickImage(ImageSource.gallery);
  }

  Future<AnalysisImageInput?> takePhoto() {
    return _pickImage(ImageSource.camera);
  }

  Future<AnalysisImageInput?> _pickImage(ImageSource source) async {
    try {
      final file = await _imagePicker.pickImage(
        source: source,
        imageQuality: (AppConstants.imageQuality * 100).round(),
        maxWidth: AppConstants.maxImageWidth.toDouble(),
        maxHeight: AppConstants.maxImageHeight.toDouble(),
      );

      if (file == null) return null;

      final bytes = await file.readAsBytes();
      _validateSize(bytes);

      final mimeType = _resolveMimeType(file);
      return AnalysisImageInput(
        fileName: _displayName(file),
        mimeType: mimeType,
        base64Data: base64Encode(bytes),
        bytes: bytes,
      );
    } catch (error) {
      if (error is ApiException) rethrow;
      throw ApiException(
        message: 'Image input failed.',
        code: 'IMAGE_INPUT_FAILED',
        details: error,
      );
    }
  }

  void _validateSize(Uint8List bytes) {
    if (bytes.lengthInBytes <= AppConstants.maxImageSizeBytes) return;

    throw ApiException(
      message: 'Selected image is too large.',
      code: 'IMAGE_TOO_LARGE',
    );
  }

  String _resolveMimeType(XFile file) {
    final mimeType = file.mimeType?.toLowerCase();
    if (_isSupportedMimeType(mimeType)) return _normalizeMimeType(mimeType!);

    final extension = file.name.split('.').last.toLowerCase();
    return switch (extension) {
      'jpg' || 'jpeg' => 'image/jpeg',
      'png' => 'image/png',
      'webp' => 'image/webp',
      'heic' => 'image/heic',
      'heif' => 'image/heif',
      _ => throw ApiException(
        message: 'Unsupported image format.',
        code: 'UNSUPPORTED_IMAGE_MIME_TYPE',
      ),
    };
  }

  bool _isSupportedMimeType(String? mimeType) {
    return switch (mimeType) {
      'image/jpeg' ||
      'image/jpg' ||
      'image/png' ||
      'image/webp' ||
      'image/heic' ||
      'image/heif' => true,
      _ => false,
    };
  }

  String _normalizeMimeType(String mimeType) {
    return mimeType == 'image/jpg' ? 'image/jpeg' : mimeType;
  }

  String _displayName(XFile file) {
    return file.name.isEmpty ? 'analysis-image' : file.name;
  }
}
