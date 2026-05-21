import { isJavaScriptFrameworkId } from '../detection/javascript/detectJavaScriptStack';
import { isPhpFrameworkId } from '../detection/php/detectPhpStack';
import { isPythonFrameworkId } from '../detection/python/detectPythonStack';
import { getJavaScriptFrameworkGuidelines } from './javascript/guidelines';
import { getPhpFrameworkGuidelines } from './php/guidelines';
import { getPythonFrameworkGuidelines } from './python/guidelines';

export function getFrameworkGuidelines(
  frameworkId: string,
  secondaryIds: string[]
): string {
  if (isPythonFrameworkId(frameworkId)) {
    return getPythonFrameworkGuidelines(frameworkId, secondaryIds);
  }
  if (isJavaScriptFrameworkId(frameworkId)) {
    return getJavaScriptFrameworkGuidelines(frameworkId, secondaryIds);
  }
  if (isPhpFrameworkId(frameworkId)) {
    return getPhpFrameworkGuidelines(frameworkId, secondaryIds);
  }
  return getPythonFrameworkGuidelines('python', secondaryIds);
}
