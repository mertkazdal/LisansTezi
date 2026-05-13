/// Common form validators for auth and profile forms.
library;

class Validators {
  Validators._();

  static String? email(String? value, {String? errorMsg}) {
    if (value == null || value.trim().isEmpty) {
      return errorMsg ?? 'Lütfen email adresinizi girin.';
    }
    final emailRegExp = RegExp(r'^[\w\-.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegExp.hasMatch(value.trim())) {
      return errorMsg ?? 'Geçerli bir email adresi girin.';
    }
    return null;
  }

  static String? password(
    String? value, {
    String? errorMsg,
    int minLength = 6,
  }) {
    if (value == null || value.trim().isEmpty) {
      return errorMsg ?? 'Lütfen şifrenizi girin.';
    }
    if (value.length < minLength) {
      return errorMsg ?? 'Şifre en az $minLength karakter olmalıdır.';
    }
    return null;
  }

  static String? username(
    String? value, {
    String? errorMsg,
    int minLength = 3,
  }) {
    if (value == null || value.trim().isEmpty) {
      return errorMsg ?? 'Lütfen kullanıcı adınızı girin.';
    }
    if (value.trim().length < minLength) {
      return errorMsg ?? 'Kullanıcı adı en az $minLength karakter olmalıdır.';
    }
    return null;
  }

  static String? requiredField(String? value, {String? errorMsg}) {
    if (value == null || value.trim().isEmpty) {
      return errorMsg ?? 'Bu alan zorunludur.';
    }
    return null;
  }
}
