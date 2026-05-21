import { isJavaScriptFrameworkId } from '../detection/javascript/detectJavaScriptStack';
import { isPythonFrameworkId } from '../detection/python/detectPythonStack';
import { getJavaScriptFrameworkGuidelines } from './javascript/guidelines';
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
  return getPythonFrameworkGuidelines('python', secondaryIds);
}
